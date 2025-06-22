import json
import boto3
import os
from datetime import datetime
import time

dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table(os.environ['CONNECTIONS_TABLE'])
messages_table = dynamodb.Table(os.environ['MESSAGES_TABLE'])

def lambda_handler(event, context):
    request_context = event['requestContext']
    connection_id = request_context['connectionId']
    route_key = request_context['routeKey']
    
    try:
        if route_key == '$connect':
            return handle_connect(connection_id, event)
        elif route_key == '$disconnect':
            return handle_disconnect(connection_id)
        elif route_key == 'sendMessage':
            body = json.loads(event.get('body', '{}'))
            return handle_send_message(connection_id, body, event)
        elif route_key == 'joinChat':
            body = json.loads(event.get('body', '{}'))
            return handle_join_chat(connection_id, body)
        else:
            return {'statusCode': 400, 'body': 'Unknown route'}
    except Exception as e:
        print(f'Error: {str(e)}')
        return {'statusCode': 500, 'body': 'Internal server error'}

def handle_connect(connection_id, event):
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('userId')
    
    if not user_id:
        return {'statusCode': 400, 'body': 'Missing userId'}
    
    ttl = int(time.time()) + 86400  # 24 hours
    
    connections_table.put_item(
        Item={
            'connectionId': connection_id,
            'userId': user_id,
            'connectedAt': int(time.time() * 1000),
            'ttl': ttl
        }
    )
    
    return {'statusCode': 200, 'body': 'Connected'}

def handle_disconnect(connection_id):
    connections_table.delete_item(
        Key={'connectionId': connection_id}
    )
    
    return {'statusCode': 200, 'body': 'Disconnected'}

def handle_send_message(connection_id, data, event):
    chat_id = data.get('chatId')
    message = data.get('message')
    user_id = data.get('userId')
    
    if not all([chat_id, message, user_id]):
        return {'statusCode': 400, 'body': 'Missing required fields'}
    
    timestamp = int(time.time() * 1000)
    message_id = f"{user_id}-{timestamp}"
    
    # Store message in DynamoDB
    messages_table.put_item(
        Item={
            'chatId': chat_id,
            'timestamp': timestamp,
            'messageId': message_id,
            'userId': user_id,
            'message': message,
            'createdAt': datetime.utcnow().isoformat(),
            'delivered': False,
            'read': False
        }
    )
    
    # Get all connections for users in this chat
    chat_connections = get_chat_connections(chat_id)
    
    # Send message to all connected users
    api_gateway = boto3.client('apigatewaymanagementapi',
        endpoint_url=f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}"
    )
    
    message_data = {
        'type': 'newMessage',
        'chatId': chat_id,
        'messageId': message_id,
        'userId': user_id,
        'message': message,
        'timestamp': timestamp,
        'createdAt': datetime.utcnow().isoformat()
    }
    
    for connection in chat_connections:
        try:
            api_gateway.post_to_connection(
                ConnectionId=connection['connectionId'],
                Data=json.dumps(message_data)
            )
        except api_gateway.exceptions.GoneException:
            # Connection is stale, remove it
            connections_table.delete_item(
                Key={'connectionId': connection['connectionId']}
            )
        except Exception as e:
            print(f"Error sending message to {connection['connectionId']}: {str(e)}")
    
    return {'statusCode': 200, 'body': 'Message sent'}

def handle_join_chat(connection_id, data):
    chat_id = data.get('chatId')
    user_id = data.get('userId')
    
    connections_table.update_item(
        Key={'connectionId': connection_id},
        UpdateExpression='SET chatId = :chatId, userId = :userId',
        ExpressionAttributeValues={
            ':chatId': chat_id,
            ':userId': user_id
        }
    )
    
    return {'statusCode': 200, 'body': 'Joined chat'}

def get_chat_connections(chat_id):
    response = connections_table.scan(
        FilterExpression='chatId = :chatId',
        ExpressionAttributeValues={':chatId': chat_id}
    )
    return response['Items']