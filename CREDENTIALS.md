# Resume Website Authentication Credentials

## Current Credentials
- **Username**: `kamal`
- **Password**: `Resume2024!`

## How to Change Credentials

### Option 1: Use Online Base64 Encoder
1. Go to: https://www.base64encode.org/
2. Enter your credentials in format: `username:password` (e.g., `kamal:MyNewPassword123`)
3. Click "Encode"
4. Copy the Base64 result
5. Update `cloudfront-functions/basic-auth.js` line 5 with the new value

### Option 2: Use Terminal (macOS/Linux)
```bash
echo -n "username:password" | base64
```

### Option 3: Use Node.js
```bash
node -e "console.log(Buffer.from('username:password').toString('base64'))"
```

## Example
For username `kamal` and password `Resume2024!`:
```bash
echo -n "kamal:Resume2024!" | base64
# Result: a2FtYWw6UmVzdW1lMjAyNCE=
```

Then update the file:
```javascript
var authString = 'Basic a2FtYWw6UmVzdW1lMjAyNCE=';
```

## After Changing Credentials
1. Save the file
2. Run: `npm run build && npx cdk deploy --profile personal`
3. Wait for deployment (~5-10 minutes)
4. Test with new credentials

## Cost
**CloudFront Functions are FREE!** 
- First 2 million invocations/month: FREE
- After that: $0.10 per 1 million invocations
- Your resume website will stay in FREE tier! ✅
