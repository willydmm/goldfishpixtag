import json
import boto3

def lambda_handler(event, context):
    # Initialize dynamo, sns, cognito client
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('TagNotification')
    cognito = boto3.client('cognito-idp')
    sns = boto3.client('sns')
    user_pool_id = 'ap-southeast-2_rxzLAaIYz'
    
    # Fetch user id and tags from event
    body = json.loads(event.get('body', '{}'))
    user_id = body.get('user_id') 
    tags = body.get('tags')
    print(f'user_id: {user_id}')
    print(f'tags: {tags}')
    
    if not user_id or not tags:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Missing user_id or tags')
        }
    
    # Fetch the user's email from Cognito
    try:
        user_response = cognito.admin_get_user(
            UserPoolId=user_pool_id,
            Username=user_id
        )
        email = next((attr['Value'] for attr in user_response['UserAttributes'] if attr['Name'] == 'email'), None)
        print("email", email)
        
    except cognito.exceptions.UserNotFoundException:
        print(f"User {user_id} not found in Cognito")
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('User not found')
        }
    except Exception as e:
        print(f"Failed to fetch user info: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Failed to fetch user info')
        }
    
    # Create a unique SNS topic for the user if it doesn't already exist
    topic_name = f"TagNotification_{user_id}"
    try:
        create_topic_response = sns.create_topic(Name=topic_name)
        user_topic_arn = create_topic_response['TopicArn']
    except Exception as e:
        print(f"Failed to create topic for user {user_id}: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Failed to create SNS topic')
        }

    # Subscribe the user to their unique SNS topic if email is found
    if email:
        try:
            subscriptions = sns.list_subscriptions_by_topic(TopicArn=user_topic_arn)
            is_subscribed = any(sub['Endpoint'] == email for sub in subscriptions['Subscriptions'])
            # check if email is already subscribed
            if not is_subscribed:
                subscribe_response = sns.subscribe(
                    TopicArn=user_topic_arn,
                    Protocol='email',
                    Endpoint=email
                )
                print("Subscription ARN:", subscribe_response['SubscriptionArn'])
            else:
                print(f"Email {email} is already subscribed")
                
        except sns.exceptions.InvalidParameterException as e:
            print(f"Failed to subscribe email {email}: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*', 
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                'body': json.dumps('Failed to subscribe email')
            }
            
    # Retrieve existing tags 
    try:
        response = table.get_item(Key={'UserId': user_id})
        if 'Item' in response:
            existing_tags = response['Item']['Tags'].split(',')
        else:
            existing_tags = []
    except Exception as e:
        print(f"Failed to retrieve existing tags: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Failed to retrieve existing tags')
        }

    # Ensure tags is a list
    if isinstance(tags, str):
        tags = [tags]

    # Merge existing tags with new tags
    merged_tags = list(set(existing_tags + tags))

    # Update or insert the user's tag preferences and topic ARN
    try:
        response = table.put_item(
            Item={
                'UserId': user_id,
                'Tags': ','.join(merged_tags),
                'TopicArn': user_topic_arn
            }
        )
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Successfully updated tag preferences')
        }
    except Exception as e:
        print(e)
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Failed to update tag preferences')
        }


