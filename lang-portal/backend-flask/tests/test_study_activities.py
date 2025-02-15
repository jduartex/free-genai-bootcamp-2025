import pytest
from app import app
import json
from datetime import datetime, timedelta, UTC

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_create_study_session(client):
    # Prepare test data with timezone-aware UTC timestamps
    current_time = datetime.now(UTC)
    study_session_data = {
        "start_time": (current_time - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "end_time": current_time.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "activity_type": "reading",
        "subject": "mathematics",
        "notes": "Test study session",
        "user_id": 1,
        "group_id": 1,
        "study_activity_id": 1
    }

    # Make POST request to create study session
    response = client.post(
        '/study_sessions',
        data=json.dumps(study_session_data),
        content_type='application/json'
    )

    # Add debug information
    if response.status_code != 201:
        print(f"\nResponse status: {response.status_code}")
        print(f"Response data: {response.data.decode('utf-8')}")
        print(f"Request data: {study_session_data}")

    # Assert response status code is 201 (Created)
    assert response.status_code == 201

    # Parse response data
    data = json.loads(response.data)

    # Assert response contains expected fields
    assert 'id' in data
    assert 'start_time' in data
    assert 'end_time' in data
    assert data['activity_type'] == study_session_data['activity_type']
    assert data['subject'] == study_session_data['subject']
    assert data['notes'] == study_session_data['notes']
    assert data['group_id'] == study_session_data['group_id']
    assert data['study_activity_id'] == study_session_data['study_activity_id']

def test_create_study_session_invalid_data(client):
    # Test with missing required fields
    invalid_data = {
        "activity_type": "reading",
        # Missing required fields
    }

    response = client.post(
        '/study_sessions',
        data=json.dumps(invalid_data),
        content_type='application/json'
    )

    # Add debug information
    if response.status_code != 400:
        print(f"\nResponse status: {response.status_code}")
        print(f"Response data: {response.data.decode('utf-8')}")

    # Assert response status code is 400 (Bad Request)
    assert response.status_code == 400

    # Test with invalid date format
    invalid_date_data = {
        "start_time": "invalid-date",
        "end_time": "invalid-date",
        "activity_type": "reading",
        "subject": "mathematics",
        "user_id": 1,
        "group_id": 1,
        "study_activity_id": 1
    }

    response = client.post(
        '/study_sessions',
        data=json.dumps(invalid_date_data),
        content_type='application/json'
    )

    # Add debug information
    if response.status_code != 400:
        print(f"\nResponse status: {response.status_code}")
        print(f"Response data: {response.data.decode('utf-8')}")

    # Assert response status code is 400 (Bad Request)
    assert response.status_code == 400 