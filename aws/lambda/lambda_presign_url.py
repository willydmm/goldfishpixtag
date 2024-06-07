import boto3
from urllib.parse import unquote_plus, urlparse
import json
import logging

def lambda_handler(event, context):
   # Log the incoming event
   logging.info("Received event: %s", event)
  
   # Check if queryStringParameters is present and not None
   if 'queryStringParameters' in event and event['queryStringParameters'] is not None:
       # Check if 'url' is present in queryStringParameters
       if 'url' in event['queryStringParameters']:
           # Log the input URL
           input_url = event['queryStringParameters']['url']
           logging.info("Input URL: %s", input_url)
          
           # Ensure input_url is not None or empty
           if input_url:
               # Proceed with further processing
               parsed_url = urlparse(unquote_plus(input_url))
               logging.info("Parsed URL: %s", parsed_url)
              
               # Parse the URL to extract the bucket name and the object key
               bucket_name = parsed_url.netloc.split('.')[0]
               object_key = parsed_url.path.lstrip('/')
              
               # Create an S3 client
               s3_client = boto3.client('s3')
              
               # Generate a presigned URL for the object
               presigned_url = s3_client.generate_presigned_url('get_object',
                                                               Params={
                                                               'Bucket': bucket_name,
                                                               'Key': object_key
                                                               },
                                                               ExpiresIn=60)
              
               # Add CORS headers to the response
               headers = {
                   'Content-Type': 'application/json',
                   'Access-Control-Allow-Origin': '*'  # Allow requests from all domains
               }
              
               return {
                   'statusCode': 200,
                   'headers': headers,
                   'body': json.dumps({
                       'presigned_url': presigned_url
                   })
               }
  
   # If no valid URL parameter is provided, return a 400 Bad Request response
   return {
       'statusCode': 400,
       'body': 'Bad Request: URL parameter is missing or invalid'
   }
