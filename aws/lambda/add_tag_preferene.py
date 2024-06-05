import json
import boto3

def lambda_handler(event, context):
    # Initialize the DynamoDB client
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('TagNotification')
    
    # Assume the incoming event contains 'user_id' and 'tags'
    user_id = event.get('user_id')
    tags = event.get('tags')
    
    if not user_id or not tags:
        return {
            'statusCode': 400,
            'body': json.dumps('Missing user_id or tags')
        }

    # Update or insert the user's tag preferences
    try:
        response = table.put_item(
            Item={
                'UserId': user_id,
                'Tags': tags
            }
        )
        return {
            'statusCode': 200,
            'body': json.dumps('Successfully updated tag preferences')
        }
    except Exception as e:
        print(e)
        return {
            'statusCode': 500,
            'body': json.dumps('Failed to update tag preferences')
        }
