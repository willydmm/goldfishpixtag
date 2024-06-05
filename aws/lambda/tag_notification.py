import json
import boto3

def lambda_handler(event, context):
    # Initialize clients
    dynamodb = boto3.resource('dynamodb')
    sns = boto3.client('sns')
    tag_pref_table = dynamodb.Table('TagNotification')
    topic_arn = 'arn:aws:sns:us-east-1:337876985551:ImageTagNotifications'
    
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            new_image = record['dynamodb']['NewImage']
            
            # Extract user ID and tags from the DynamoDB stream record
            user_id = new_image['UserId']['S'] 
            print("user_id: ", user_id)
            
            tags = [] 
            # Parse tags from the new image
            if 'Tags' in new_image:
                if new_image['Tags']['S'] == "[]":
                    tags = []
                else:
                    tags = json.loads(new_image['Tags']['S'])
            print("tags:", tags)
            
            # Retrieve user preferences from table
            response = tag_pref_table.get_item(Key={'UserId': user_id})
            if 'Item' in response:
                user_prefs = response['Item']['Tags'].split(',')

                # Check each tag in the uploaded image against the user's preferences
                matched_tags = [tag for tag in tags if tag in user_prefs]
                if matched_tags:
                    # If there are matching tags, construct and send a notification
                    message = f"You uploaded an image with your preferred tags ({matched_tags}). Log in to see!"
                    sns.publish(
                        TopicArn=topic_arn,
                        Message=message,
                        Subject='New Image Notification'
                    )
                    print(f"Notification sent for user {user_id} with matched tags: {matched_tags}")

    return {
        'statusCode': 200,
        'body': json.dumps('Successfully processed DynamoDB Stream record.')
    }
