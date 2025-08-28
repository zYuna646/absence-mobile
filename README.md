# Absence Mobile App 👋

Aplikasi absensi dan manajemen logbook berbasis mobile yang dikembangkan dengan [Expo](https://expo.dev).

## Release Notes - Versi 1.0.0

### Fitur Utama

#### Sistem Absensi
- Check-in dan check-out dengan validasi lokasi dan foto
- Pencatatan waktu dan lokasi otomatis
- Riwayat absensi lengkap dengan status

#### Manajemen Logbook
- Pencatatan aktivitas harian
- Verifikasi logbook oleh pembimbing
- Status verifikasi (Belum Selesai, Belum Diverifikasi, Sudah Diverifikasi)

#### Ruangan dan Kegiatan
- Pemilihan ruangan untuk absensi
- Informasi status ruangan (tersedia/tertutup)
- Detail pembimbing dan lokasi

#### Penilaian
- Sistem penilaian untuk aktivitas
- Catatan dan skor untuk sub-aktivitas
- Riwayat penilaian

#### Notifikasi
- Dukungan push notification
- Notifikasi untuk tugas dan pengingat

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Push Notifications

This app supports push notifications that can be triggered from web/backend. Here's how to send notifications:

### API Endpoint
```
POST https://mobile-project.fzrsahi.com/api/notifications/send
```

### Headers
```
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json
```

### Request Body
```json
{
  "title": "Notification Title",
  "message": "Your notification message here",
  "user_id": "target_user_id", // Optional: specific user
  "push_token": "expo_push_token", // Optional: specific device
  "data": {
    "type": "custom_type",
    "additional_data": "any_value"
  }
}
```

### Example using cURL
```bash
curl -X POST https://mobile-project.fzrsahi.com/api/notifications/send \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Assignment",
    "message": "You have a new assignment to complete",
    "user_id": "123",
    "data": {
      "type": "assignment",
      "assignment_id": "456"
    }
  }'
```

### Example using JavaScript/Fetch
```javascript
fetch('https://mobile-project.fzrsahi.com/api/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_AUTH_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Meeting Reminder',
    message: 'You have a meeting in 15 minutes',
    user_id: '123',
    data: {
      type: 'meeting_reminder',
      meeting_id: '789'
    }
  })
})
.then(response => response.json())
.then(data => console.log('Notification sent:', data))
.catch(error => console.error('Error:', error));
```

### Notification Types
The app handles different notification types based on the `data.type` field:

- `file_download`: Opens file manager when tapped
- `attendance_reminder`: Navigates to attendance screen
- `verification_request`: Navigates to verification screen
- Custom types can be added as needed

### Device Registration
Devices are automatically registered when users log in. The app sends the Expo push token to the backend at:
```
POST https://mobile-project.fzrsahi.com/api/device/register
```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
