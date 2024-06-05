import json
import boto3
import cv2
import os

s3 = boto3.client('s3')
sns = boto3.client('sns')
THUMBNAIL_BUCKET_NAME = 'goldfishthumbnails'
THUMBNAIL_SIZE = (300, 300)  # Desired maximum thumbnail size
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:337876985551:ThumbnailCreated'

def lambda_handler(event, context):
    print("Event: ", event)
    # Get the bucket and object key from the event
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']

    print(f"Bucket: {bucket_name}, Key: {object_key}")

    # Parse user ID from the object key
    user_id = object_key.split('/')[0]

    # Download the image from S3
    download_path = f"/tmp/{os.path.basename(object_key)}"
    try:
        s3.download_file(bucket_name, object_key, download_path)
        print(f"Downloaded {object_key} from {bucket_name} to {download_path}")
    except Exception as e:
        print(f"Error downloading file: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error downloading file: {e}")
        }

    # Read the image using OpenCV
    image = cv2.imread(download_path)
    if image is None:
        print("The uploaded file is not a valid image.")
        return {
            'statusCode': 400,
            'body': json.dumps('The uploaded file is not a valid image.')
        }

    # Resize the image to create a thumbnail while maintaining aspect ratio
    thumbnail = resize_image(image, THUMBNAIL_SIZE)

    # Save the thumbnail to a temporary file
    thumbnail_path = f"/tmp/thumbnail-{os.path.basename(object_key)}"
    cv2.imwrite(thumbnail_path, thumbnail)
    print(f"Thumbnail saved to {thumbnail_path}")

    # Modify the thumbnail name by appending '_thumbnail' before the extension
    thumbnail_key = append_thumbnail_suffix(object_key)

    # Upload the thumbnail to the thumbnails S3 bucket
    try:
        s3.upload_file(thumbnail_path, THUMBNAIL_BUCKET_NAME, thumbnail_key)
        print(f"Uploaded thumbnail to {THUMBNAIL_BUCKET_NAME}/{thumbnail_key}")
    except Exception as e:
        print(f"Error uploading thumbnail: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error uploading thumbnail: {e}")
        }

    # Publish message to SNS topic
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps({
                'bucket': bucket_name,
                'key': object_key,
                'thumbnail_bucket': THUMBNAIL_BUCKET_NAME,
                'thumbnail_key': thumbnail_key,
                'user_id': user_id  # Include user ID in the message
            })
        )
        print(f"Published message to SNS topic {SNS_TOPIC_ARN}")
    except Exception as e:
        print(f"Error publishing message to SNS: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error publishing message to SNS: {e}")
        }

    # Clean up temporary files
    os.remove(download_path)
    os.remove(thumbnail_path)

    return {
        'statusCode': 200,
        'body': json.dumps('Thumbnail created and message published successfully.')
    }

def resize_image(image, size):
    h, w = image.shape[:2]

    # Compute scaling factors to fit the image within the desired size
    scale_w = size[0] / w
    scale_h = size[1] / h

    # Choose the smaller scaling factor to ensure the image fits within the desired dimensions
    scale = min(scale_w, scale_h)

    # Compute the new size of the image
    new_width = int(w * scale)
    new_height = int(h * scale)

    # Resize the image
    resized_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

    return resized_image

def append_thumbnail_suffix(key):
    # Append '_thumbnail' before the file extension in the key
    parts = key.rsplit('.', 1)
    if len(parts) == 2:
        return f"{parts[0]}_thumbnail.{parts[1]}"
    else:
        return f"{key}_thumbnail"
