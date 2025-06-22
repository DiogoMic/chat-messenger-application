import json
import boto3
import os
from datetime import datetime
import time
import random
import string

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

messages_table = dynamodb.Table(os.environ['ChatMessages-dev'])
chat_rooms_table = dynamodb.Table(os.environ['ChatRooms-dev'])
media_bucket = os.environ['MEDIA_BUCKET']

def lambda_handler(event, context):
    http_method = event['httpMethod']
    path = event['path']
    path_parameters = event.get('pathParameters') or {}
    body = event.get('body', '{}')
    query_params = event.get('queryStringParameters') or {}
    
    try:
        route = f"{http_method} {path}"
        
        if route == 'GET /chats':
            return get_chats(query_params)
        elif route == 'GET /chats/{chatId}/messages':
            return get_chat_messages(path_parameters['chatId'], query_params)
        elif route == 'POST /chats':
            return create_chat(json.loads(body))
        elif route == 'POST /upload-url':
            return get_upload_url(json.loads(body))
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found'})
            }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def get_chats(query_params):
    user_id = query_params.get('userId')
    
    if not user_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing userId'})
        }
    
    # Get user's chats - simplified version
    response = chat_rooms_table.scan(
        FilterExpression='contains(participants, :userId)',
        ExpressionAttributeValues={':userId': user_id}
    )
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response['Items'])
    }

def get_chat_messages(chat_id, query_params):
    limit = int(query_params.get('limit', '50'))
    last_timestamp = query_params.get('lastTimestamp')
    
    query_kwargs = {
        'KeyConditionExpression': 'chatId = :chatId',
        'ExpressionAttributeValues': {':chatId': chat_id},
        'ScanIndexForward': False,  # Get newest first
        'Limit': limit
    }
    
    if last_timestamp:
        query_kwargs['ExclusiveStartKey'] = {
            'chatId': chat_id,
            'timestamp': int(last_timestamp)
        }
    
    response = messages_table.query(**query_kwargs)
    
    # Return oldest first for UI
    messages = list(reversed(response['Items']))
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'messages': messages,
            'lastEvaluatedKey': response.get('LastEvaluatedKey')
        })
    }

def create_chat(data):
    participants = data.get('participants')
    chat_name = data.get('chatName')
    chat_type = data.get('chatType', 'direct')
    
    if not participants or len(participants) < 2:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'At least 2 participants required'})
        }
    
    # Generate chat ID
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
    chat_id = f"chat-{int(time.time() * 1000)}-{random_suffix}"
    
    chat_rooms_table.put_item(
        Item={
            'chatId': chat_id,
            'participants': participants,
            'chatName': chat_name,
            'chatType': chat_type,
            'createdAt': datetime.utcnow().isoformat(),
            'lastActivity': datetime.utcnow().isoformat()
        }
    )
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'chatId': chat_id})
    }

def get_upload_url(data):
    file_name = data.get('fileName')
    file_type = data.get('fileType')
    chat_id = data.get('chatId')
    
    if not all([file_name, file_type, chat_id]):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    key = f"chats/{chat_id}/{int(time.time() * 1000)}-{file_name}"
    
    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': media_bucket,
            'Key': key,
            'ContentType': file_type
        },
        ExpiresIn=300  # 5 minutes
    )
    
    download_url = f"https://{media_bucket}.s3.amazonaws.com/{key}"
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'uploadUrl': upload_url,
            'downloadUrl': download_url,
            'key': key
        })
    }