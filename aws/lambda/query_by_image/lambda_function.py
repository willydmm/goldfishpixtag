import json
import boto3
import base64
import io
from PIL import Image
import numpy as np
import cv2
import os
from boto3.dynamodb.conditions import Attr

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = 'UserImage'
CONFTHRESH = 0.6  # Confidence threshold for object detection
NMSTHRESH = 0.1 
REGION = 'us-east-1'

def lambda_handler(event, context):
    try:
        # Get the UserId from headers
        user_id = event['headers'].get('Userid')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, UserId',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps('UserId is required in the request headers.')
            }

        # Decode the base64 file
        file_content = base64.b64decode(event['body'])
        file = io.BytesIO(file_content)

        # Check if the file is an image
        try:
            image = Image.open(file)
            image.verify()
        except (IOError, SyntaxError) as e:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, UserId',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps('The uploaded file is not a valid image.')
            }

        # Convert the image to OpenCV format
        image = Image.open(io.BytesIO(file_content))
        np_image = np.array(image)
        cv_image = cv2.cvtColor(np_image, cv2.COLOR_RGB2BGR)

        # Perform object detection
        tags = detect_objects(cv_image)
        if not tags:
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, UserId',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps('No objects detected in the image.')
            }

        # Query DynamoDB for images containing the detected tags and belonging to the current user
        matching_images = query_images(tags, user_id)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, UserId',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(matching_images)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, UserId',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(f'An error occurred: {str(e)}')
        }

def detect_objects(image):
    try:
        s3.download_file('goldfishconfigs', 'yolo_tiny_configs/coco.names', '/tmp/coco.names')
        s3.download_file('goldfishconfigs', 'yolo_tiny_configs/yolov3-tiny.cfg', '/tmp/yolov3-tiny.cfg')
        s3.download_file('goldfishconfigs', 'yolo_tiny_configs/yolov3-tiny.weights', '/tmp/yolov3-tiny.weights')
    except Exception as e:
        print(f"Error downloading config files: {e}")
        raise e

    LABELS = get_labels('/tmp/coco.names')
    CFG = get_config('/tmp/yolov3-tiny.cfg')
    Weights = get_weights('/tmp/yolov3-tiny.weights')

    model = load_model(CFG, Weights)
    predictions = do_prediction(image, model, LABELS)

    tags = [pred['label'] for pred in predictions if pred['confidence'] > CONFTHRESH]
    return tags

def get_labels(labels_path):
    with open(labels_path) as f:
        LABELS = f.read().strip().split("\n")
    return LABELS

def get_weights(weights_path):
    return weights_path

def get_config(config_path):
    return config_path

def load_model(configpath, weightspath):
    net = cv2.dnn.readNetFromDarknet(configpath, weightspath)
    return net

def do_prediction(image, net, LABELS):
    (H, W) = image.shape[:2]
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]
    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    layerOutputs = net.forward(ln)
    boxes, confidences, classIDs = [], [], []

    for output in layerOutputs:
        for detection in output:
            scores = detection[5:]
            classID = np.argmax(scores)
            confidence = scores[classID]

            if confidence > CONFTHRESH:
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))
                boxes.append([x, y, int(width), int(height)])
                confidences.append(float(confidence))
                classIDs.append(classID)

    idxs = cv2.dnn.NMSBoxes(boxes, confidences, CONFTHRESH, NMSTHRESH)
    predictions = []

    if len(idxs) > 0:
        for i in idxs.flatten():
            predictions.append({
                "label": LABELS[classIDs[i]],
                "confidence": confidences[i],
                "box": boxes[i]
            })
    return predictions

def query_images(tags, user_id):
    table = dynamodb.Table(TABLE_NAME)
    response = table.scan(
        FilterExpression=Attr('UserId').eq(user_id)
    )
    items = response.get('Items', [])

    matching_images = []
    for item in items:
        image_tags = json.loads(item.get('Tags'))
        if all(tag in image_tags for tag in tags):
            thumbnail_url = item.get('ThumbnailImageUrl')
            if thumbnail_url:
                matching_images.append({
                    "url": thumbnail_url,
                    "tags": item.get('Tags')
                })

    result = {
        "links": [image["url"] for image in matching_images],
        "tags": [image["tags"] for image in matching_images]
    }

    return result
