# Deployment Guide

## Backend Deployment (EC2)

### Prerequisites
- EC2 instance with Python 3.8+ installed
- OpenSearch running on the same or accessible EC2 instance
- Security group allowing inbound traffic on port 8000

### Steps

1. **Upload backend files to EC2:**
   ```bash
   scp -r backend/ ubuntu@your-ec2-ip:~/say-like-a-native/
   ```

2. **Install dependencies:**
   ```bash
   ssh ubuntu@your-ec2-ip
   cd ~/say-like-a-native/backend
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values:
   # - EC2_OPENSEARCH_HOST=localhost (if OpenSearch is on same instance)
   # - ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```

4. **Start the backend:**
   ```bash
   ./start.sh
   ```

5. **Configure security group:**
   - Allow inbound traffic on port 8000 from anywhere (0.0.0.0/0) or specific IPs
   - Your backend will be accessible at: `http://your-ec2-ip:8000`

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository with your frontend code

### Steps

1. **Connect repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as the root directory

2. **Configure environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `http://your-ec2-ip:8000`

3. **Deploy:**
   - Vercel will automatically build and deploy
   - Your app will be available at: `https://your-app.vercel.app`

4. **Update backend CORS:**
   - Update your EC2 backend's `.env` file:
   - Set `ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000`
   - Restart the backend: `./start.sh`

## Testing

1. Visit your Vercel app URL
2. Try searching for phrases
3. Verify the backend URL shown at the bottom matches your EC2 instance
4. Test the replay functionality

## Troubleshooting

### CORS Issues
- Ensure `ALLOWED_ORIGINS` in backend includes your Vercel domain
- Check that the domain format is exact (https://your-app.vercel.app)

### Backend Not Accessible
- Check EC2 security group allows port 8000
- Verify backend is running: `curl http://localhost:8000` from EC2
- Check if EC2 instance has a public IP

### Frontend Build Issues
- Ensure all environment variables are set in Vercel
- Check build logs in Vercel dashboard