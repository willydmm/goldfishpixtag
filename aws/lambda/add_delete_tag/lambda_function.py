import json
import boto3
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserImage')

def lambda_handler(event, context):
   try:
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

       # Parse the request body
       try:
           body = json.loads(event['body'])
           urls = body.get('url', [])
           operation_type = body.get('type')
           tags = body.get('tags', [])
          
           if not urls or operation_type is None or not tags:
               return {
                   'statusCode': 400,
                   'body': json.dumps('URLs, type, and tags are required in the request body'),
                   'headers': {
                       'Access-Control-Allow-Origin': '*',
                       'Access-Control-Allow-Headers': 'Content-Type',
                       'Access-Control-Allow-Methods': 'OPTIONS,POST'
                   }
               }
       except Exception as e:
           return {
               'statusCode': 400,
               'body': json.dumps(f"Invalid request body: {str(e)}"),
               'headers': {
                   'Access-Control-Allow-Origin': '*',
                   'Access-Control-Allow-Headers': 'Content-Type',
                   'Access-Control-Allow-Methods': 'OPTIONS,POST'
               }
           }

       # Process each URL
       for url in urls:
           response = table.scan(
               FilterExpression=Key('ThumbnailImageUrl').eq(url)
           )
           items = response.get('Items', [])
           if not items:
               continue

           item = items[0]
           image_tags = json.loads(item.get('Tags', '[]'))
          
           if operation_type == 1:  # Add tags
               for tag in tags:
                   if tag not in image_tags:
                       image_tags.append(tag)
           elif operation_type == 0:  # Remove tags
               image_tags = [tag for tag in image_tags if tag not in tags]

           # Update the item in DynamoDB
           table.update_item(
               Key={'UserId': item['UserId'], 'ImageKey': item['ImageKey']},
               UpdateExpression='SET Tags = :tags',
               ExpressionAttributeValues={':tags': json.dumps(image_tags)}
           )

       return {
           'statusCode': 200,
           'body': json.dumps('Tags updated successfully'),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }

   except Exception as e:
       return {
           'statusCode': 500,
           'body': json.dumps(f'An error occurred: {str(e)}'),
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'OPTIONS,POST'
           }
       }
