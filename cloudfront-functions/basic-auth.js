function handler(event) {
    var request = event.request;
    var headers = request.headers;
    
    // Basic authentication check
    // Credentials are base64 encoded in the authString below
    var authString = 'Basic a2FtYWw6UmVzdW1lMjAyNCE=';
    
    // Check if Authorization header exists and matches
    if (typeof headers.authorization === 'undefined' || 
        headers.authorization.value !== authString) {
        
        // Return 401 with browser login prompt
        return {
            statusCode: 401,
            statusDescription: 'Unauthorized',
            headers: {
                'www-authenticate': { value: 'Basic realm="Kamalakannan Sundaramurthy - Resume"' },
                'cache-control': { value: 'no-cache, no-store, must-revalidate' }
            }
        };
    }
    
    // Authentication successful
    return request;
}
