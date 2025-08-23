 # Web Integration untuk Trigger Notifikasi

## 1. Arsitektur Sistem

```
Website Eksternal → Backend API → Expo Push Service → Mobile App
```

## 2. Backend API Endpoints

### A. Register Device Token
```
POST /api/device/register
```

**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Body:**
```json
{
  "push_token": "ExponentPushToken[xxx]",
  "user_id": "123",
  "platform": "android"
}
```

### B. Send Notification
```
POST /api/notifications/send
```

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Notification Title",
  "message": "Your message here",
  "user_id": "123",
  "data": {
    "type": "custom_type",
    "additional_data": "value"
  }
}
```

## 3. Website Integration Examples

### A. HTML + JavaScript (Vanilla)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Notification Sender</title>
</head>
<body>
    <h1>Send Push Notification</h1>
    
    <form id="notificationForm">
        <div>
            <label>Title:</label>
            <input type="text" id="title" required>
        </div>
        
        <div>
            <label>Message:</label>
            <textarea id="message" required></textarea>
        </div>
        
        <div>
            <label>User ID:</label>
            <input type="text" id="userId">
        </div>
        
        <div>
            <label>Notification Type:</label>
            <select id="notificationType">
                <option value="general">General</option>
                <option value="attendance_reminder">Attendance Reminder</option>
                <option value="verification_request">Verification Request</option>
                <option value="file_download">File Download</option>
            </select>
        </div>
        
        <button type="submit">Send Notification</button>
    </form>

    <script>
        const API_BASE_URL = 'https://mobile-project.fzrsahi.com/api';
        const ADMIN_TOKEN = 'your_admin_token_here'; // Harus dari backend admin
        
        document.getElementById('notificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('title').value;
            const message = document.getElementById('message').value;
            const userId = document.getElementById('userId').value;
            const notificationType = document.getElementById('notificationType').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/notifications/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ADMIN_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        message: message,
                        user_id: userId || undefined,
                        data: {
                            type: notificationType,
                            sent_from: 'web_admin',
                            timestamp: new Date().toISOString()
                        }
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('Notification sent successfully!');
                    document.getElementById('notificationForm').reset();
                } else {
                    alert(`Error: ${result.message || 'Failed to send notification'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error occurred');
            }
        });
    </script>
</body>
</html>
```

### B. React.js Integration

```jsx
import React, { useState } from 'react';

const NotificationSender = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        userId: '',
        notificationType: 'general'
    });
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = 'https://mobile-project.fzrsahi.com/api';
    const ADMIN_TOKEN = process.env.REACT_APP_ADMIN_TOKEN; // Dari environment variable

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    message: formData.message,
                    user_id: formData.userId || undefined,
                    data: {
                        type: formData.notificationType,
                        sent_from: 'web_admin',
                        timestamp: new Date().toISOString()
                    }
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Notification sent successfully!');
                setFormData({ title: '', message: '', userId: '', notificationType: 'general' });
            } else {
                alert(`Error: ${result.message || 'Failed to send notification'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="notification-sender">
            <h2>Send Push Notification</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title:</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Message:</label>
                    <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>User ID (optional):</label>
                    <input
                        type="text"
                        value={formData.userId}
                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                        placeholder="Leave empty for broadcast"
                    />
                </div>

                <div className="form-group">
                    <label>Type:</label>
                    <select
                        value={formData.notificationType}
                        onChange={(e) => setFormData({...formData, notificationType: e.target.value})}
                    >
                        <option value="general">General</option>
                        <option value="attendance_reminder">Attendance Reminder</option>
                        <option value="verification_request">Verification Request</option>
                        <option value="file_download">File Download</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Notification'}
                </button>
            </form>
        </div>
    );
};

export default NotificationSender;
```

### C. PHP Integration

```php
<?php
class NotificationSender {
    private $apiBaseUrl = 'https://mobile-project.fzrsahi.com/api';
    private $adminToken;
    
    public function __construct($adminToken) {
        $this->adminToken = $adminToken;
    }
    
    public function sendNotification($title, $message, $userId = null, $data = []) {
        $url = $this->apiBaseUrl . '/notifications/send';
        
        $payload = [
            'title' => $title,
            'message' => $message,
            'data' => array_merge($data, [
                'sent_from' => 'php_web',
                'timestamp' => date('c')
            ])
        ];
        
        if ($userId) {
            $payload['user_id'] = $userId;
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->adminToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'success' => $httpCode === 200,
            'response' => json_decode($response, true),
            'http_code' => $httpCode
        ];
    }
}

// Usage
$notificationSender = new NotificationSender('your_admin_token_here');

$result = $notificationSender->sendNotification(
    'Meeting Reminder',
    'You have a meeting in 15 minutes',
    '123', // user ID
    [
        'type' => 'meeting_reminder',
        'meeting_id' => '456'
    ]
);

if ($result['success']) {
    echo "Notification sent successfully!";
} else {
    echo "Failed to send notification: " . $result['response']['message'];
}
?>
```

## 4. Authentication & Security

### A. Admin Token
Website eksternal harus memiliki admin token yang valid:

```javascript
// Dapatkan admin token dari login admin
const getAdminToken = async () => {
    const response = await fetch('https://mobile-project.fzrsahi.com/api/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: 'admin_username',
            password: 'admin_password'
        })
    });
    
    const data = await response.json();
    return data.token;
};
```

### B. CORS Configuration
Backend harus mengizinkan CORS dari domain website:

```javascript
// Backend CORS config
app.use(cors({
    origin: [
        'https://your-website.com',
        'https://admin.your-website.com'
    ],
    credentials: true
}));
```

## 5. Advanced Features

### A. Scheduled Notifications
```javascript
const scheduleNotification = async (title, message, scheduleTime, userId) => {
    const response = await fetch(`${API_BASE_URL}/notifications/schedule`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            message,
            user_id: userId,
            schedule_time: scheduleTime, // ISO string
            data: {
                type: 'scheduled',
                scheduled_from: 'web'
            }
        })
    });
    
    return response.json();
};
```

### B. Bulk Notifications
```javascript
const sendBulkNotification = async (title, message, userIds) => {
    const response = await fetch(`${API_BASE_URL}/notifications/bulk`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            message,
            user_ids: userIds,
            data: {
                type: 'bulk',
                sent_from: 'web_bulk'
            }
        })
    });
    
    return response.json();
};
```

## 6. Testing

### A. Test dengan cURL
```bash
curl -X POST https://mobile-project.fzrsahi.com/api/notifications/send \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test from website",
    "user_id": "123",
    "data": {
      "type": "test",
      "source": "curl_test"
    }
  }'
```

### B. Test dengan Postman
1. Method: POST
2. URL: `https://mobile-project.fzrsahi.com/api/notifications/send`
3. Headers:
   - `Authorization: Bearer YOUR_ADMIN_TOKEN`
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "title": "Test dari Postman",
  "message": "Ini adalah test notification dari Postman",
  "user_id": "123",
  "data": {
    "type": "test",
    "source": "postman"
  }
}
```

## 7. Error Handling

```javascript
const sendNotificationWithRetry = async (notificationData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationData)
            });

            if (response.ok) {
                return await response.json();
            } else if (response.status === 401) {
                throw new Error('Unauthorized - Check admin token');
            } else if (response.status === 429) {
                // Rate limit - wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Unknown error');
            }
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            console.log(`Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};
```

Dengan implementasi ini, website eksternal dapat dengan mudah mengirim push notifications ke mobile app melalui backend API.