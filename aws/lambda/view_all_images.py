import json
import boto3

def lambda_handler(event, context):
    # Initialize DynamoDB client
    dynamo_client = boto3.client('dynamodb')
    table_name = 'UserImage'

    query_params = event.get('queryStringParameters', {})
    print("Received event:", json.dumps(event))
    user_id = query_params.get('userName')

    if not user_id:
        return {
            'statusCode': 400,
            'body': json.dumps('No user ID provided')
        }

    try:
        # Query the DynamoDB table for thumbnails based on UserId
        response = dynamo_client.query(
            TableName=table_name,
            KeyConditionExpression='UserId = :user_id',
            ExpressionAttributeValues={
                ':user_id': {'S': user_id}
            }
        )
        
        print("DynamoDB Query Response:", json.dumps(response))

        images_info = []
        if 'Items' in response:
            for item in response['Items']:
                # Extract thumbnail URL and tags
                thumbnail_url = item.get('ThumbnailImageUrl', {}).get('S', '')
                
                # Handle Tags attribute
                tags = []
                if 'Tags' in item:
                    if isinstance(item['Tags'], dict) and 'S' in item['Tags']:
                        # If Tags is a string representing an empty list, convert it to an actual empty list
                        if item['Tags']['S'] == "[]":
                            tags = []
                        else:
                            tags = json.loads(item['Tags']['S'])
                
                print("Tags for item:", tags)

                images_info.append({
                    'thumbnailUrl': thumbnail_url,
                    'tags': tags
                })

        print("Final images_info:", images_info)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'images': images_info
            })
        }

    except Exception as e:
        print("Error:", e)
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Credentials': 'true',
            },
            'body': json.dumps({
                "message": "Failed to fetch thumbnails",
                "error": str(e)
            })
        }
