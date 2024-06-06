import json
import boto3
import numpy as np
import cv2
import os
from datetime import datetime, timezone

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = 'UserImage'
CONFTHRESH = 0.6  # Confidence threshold for object detection
NMSTHRESH = 0.1 
REGION = 'us-east-1'

def lambda_handler(event, context):
    # Extract the message from the SNS event
    message = json.loads(event['Records'][0]['Sns']['Message'])
    bucket = message['bucket']
    key = message['key']
    thumbnail_bucket = message['thumbnail_bucket']
    thumbnail_key = message['thumbnail_key']
    user_id = message['user_id']  # Retrieve user ID from the SNS message

    print(f"Bucket: {bucket}")
    print(f"Key: {key}")
    print(f"Thumbnail Bucket: {thumbnail_bucket}")
    print(f"Thumbnail Key: {thumbnail_key}")
    print(f"User ID: {user_id}")

    # Clean the key to ensure no extra characters
    clean_key = key.strip()
    download_path = f'/tmp/{os.path.basename(clean_key)}'
    print(f"Download Path: {download_path}")

    try:
        s3.download_file(bucket, clean_key, download_path)
    except Exception as e:
        print(f"Error downloading file: {e}")
        raise e

    img = cv2.imread(download_path)
    if img is None:
        print("The uploaded file is not a valid image.")
        raise Exception('The uploaded file is not a valid image.')

    npimg = np.array(img)
    image = npimg.copy()
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Load YOLO model and configs
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

    print(f"Predictions: {predictions}")

    # Extract labels from predictions
    tags = [pred['label'] for pred in predictions if pred['confidence'] > CONFTHRESH]
    print(f"Tags: {tags}")

    # Generate S3 URLs
    original_image_url = f"https://{bucket}.s3.{REGION}.amazonaws.com/{key}"
    thumbnail_image_url = f"https://{thumbnail_bucket}.s3.{REGION}.amazonaws.com/{thumbnail_key}"

    # Prepare item to update DynamoDB
    item = {
        'UserId': user_id,
        'ImageKey': key,
        'ThumbnailKey': thumbnail_key,
        'OriginalImageUrl': original_image_url,
        'ThumbnailImageUrl': thumbnail_image_url,
        'Tags': json.dumps(tags),
        'RecordedAt': datetime.now(timezone.utc).isoformat()
    }

    # Update DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    try:
        table.put_item(Item=item)
        print("Successfully updated DynamoDB")
    except Exception as e:
        print(f"Error updating DynamoDB: {e}")
        raise e

    return {
        'statusCode': 200,
        'body': json.dumps(tags)
    }

def get_labels(labels_path):
    LABELS = open(labels_path).read().strip().split("\n")
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
