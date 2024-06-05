import boto3
import json
import urllib.parse

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('UserImage')

    try:
        body = json.loads(event['body'])
        thumbnail_urls = body['thumbnailUrls']
    except (KeyError, json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing request body: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(f'Bad request: {str(e)}')
        }

    responses = []
    for url in thumbnail_urls:
        bucket_name = 'goldfishthumbnails'
        key = '/'.join(url.split('/')[-2:])
        decoded_key = urllib.parse.unquote_plus(key)
        print(f"Decoded Thumbnail Key: {decoded_key}")
        
        s3_response = s3.delete_object(Bucket=bucket_name, Key=decoded_key)
        print(f"S3 Delete Response: {s3_response}")
        
        original_bucket_name = 'goldfishimages'
        original_key = decoded_key.replace('_thumbnail', '')
        user_id = original_key.split('/')[0]
        print(f"Original Key: {original_key}, UserID: {user_id}")
        
        s3_response = s3.delete_object(Bucket=original_bucket_name, Key=original_key)
        print(f"S3 Delete Response: {s3_response}")
        
        dynamodb_response = table.delete_item(
            Key={
                'UserId': user_id,
                'ImageKey': original_key
            }
        )
        print(f"DynamoDB Delete Response: {dynamodb_response}")
        
        responses.append({
            'URL': url, 
            'Status': 'Deleted', 
            'S3Response': str(s3_response), 
            'DynamoDBResponse': str(dynamodb_response)
        })

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Methods': 'DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(responses)
    }

