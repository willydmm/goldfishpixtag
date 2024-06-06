import json
import boto3
import base64
import uuid
from PIL import Image
import io
import mimetypes

s3 = boto3.client('s3')
BUCKET_NAME = 'goldfishimages'

def lambda_handler(event, context):
    try:
        # Extract user name from headers
        user_id = event['headers'].get('x-user-id')

        # Decode the base64 file
        file_content = base64.b64decode(event['body'])
        file = io.BytesIO(file_content)

        # Check if the file is an image
        try:
            image = Image.open(file)
            image.verify()
            mime_type = Image.MIME[image.format]  # Get the MIME type
            extension = mimetypes.guess_extension(mime_type)  # Get the file extension
        except (IOError, SyntaxError) as e:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,x-user-id',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps('The uploaded file is not a valid image.')
            }

        # Generate a unique file name with the extension
        unique_file_name = str(uuid.uuid4()) + extension

        # Create a key for the S3 object using user-specific folder
        s3_key = f"{user_id}/{unique_file_name}"

        # If the file is an image, upload to S3
        s3.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=file_content)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,x-user-id',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps('File uploaded successfully.')
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,x-user-id',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(f'An error occurred: {str(e)}')
        }
