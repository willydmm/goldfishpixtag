import json
import boto3
from boto3.dynamodb.conditions import Attr
import base64

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserImage')

def lambda_handler(event, context):
   print("Event: ", event)
  
   # Ensure the request is a POST request
   if event['httpMethod'] != 'POST':
       return {
           'statusCode': 405,
           'body': json.dumps('Method Not Allowed'),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }
  
   # Extract the token from the Authorization header
   auth_header = event['headers'].get('Authorization')
   if not auth_header:
       return {
           'statusCode': 401,
           'body': json.dumps('Unauthorized'),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }
  
   id_token = auth_header.split(' ')[1]
   user_info = parse_jwt(id_token)
   user_id = user_info['cognito:username']
   print("User ID: ", user_id)
  
   # Parse the request body
   try:
       body = json.loads(event['body'])
       print("Request Body: ", body)
       tags = body.get('tags', {})
       if not tags:
           return {
               'statusCode': 400,
               'body': json.dumps('Tags in the request body are required'),
               'headers': {
                   'Access-Control-Allow-Origin': '*',
                   'Access-Control-Allow-Headers': 'Content-Type',
                   'Access-Control-Allow-Methods': 'OPTIONS,POST'
               }
           }
   except Exception as e:
       print("Error parsing request body: ", e)
       return {
           'statusCode': 400,
           'body': json.dumps(f"Invalid request body: {str(e)}"),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }

   # Scan the table and manually filter results
   try:
       response = table.scan(
           FilterExpression=Attr('UserId').eq(user_id)
       )
       print("DynamoDB Response: ", response)
       items = response['Items']
      
       # Manual filtering based on tags and their counts
       filtered_items = []
       for item in items:
           item_tags = json.loads(item['Tags'])
           print("Item Tags: ", item_tags)
           tag_count = {tag: item_tags.count(tag) for tag in item_tags}
           print("Tag Count: ", tag_count)
           match = all(tag_count.get(tag, 0) >= count for tag, count in tags.items())
           if match:
               filtered_items.append(item)

       # Extract the S3 URLs and tags from the filtered items
       image_links = [item['ThumbnailImageUrl'] for item in filtered_items]
       original_image_links = [item['OriginalImageUrl'] for item in filtered_items]
       tags = [item['Tags'] for item in filtered_items]
      
       print("Image Links: ", image_links)
       print("Original Image Links: ", original_image_links)
       print("Tags: ", tags)

       return_payload = {
           'links': image_links,
           'tags': tags
       }
       print("Return Payload: ", return_payload)

       return {
           'statusCode': 200,
           'body': json.dumps(return_payload),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }
  
   except Exception as e:
       print("Error querying DynamoDB: ", e)
       return {
           'statusCode': 500,
           'body': json.dumps(f"Error querying DynamoDB: {str(e)}"),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }

def parse_jwt(token):
   print("Parsing JWT: ", token)
   # Decode the token
   parts = token.split('.')
   payload = parts[1]
   padding = len(payload) % 4
   if padding != 0:
       payload += '=' * (4 - padding)
   decoded = base64.b64decode(payload)
   decoded_payload = json.loads(decoded)
   print("Decoded JWT Payload: ", decoded_payload)
   return decoded_payload