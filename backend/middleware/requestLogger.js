const requestLogger = (req, res, next) => {
    if (process.env.ENABLE_REQUEST_LOGS !== 'true') {
        return next();
    }

    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    const startTime = Date.now();

    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
    
    // Log request body only when explicitly enabled (excluding sensitive data)
    if (process.env.LOG_REQUEST_BODY === 'true' && req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        
        // Remove sensitive fields
        delete sanitizedBody.password;
        delete sanitizedBody.password_hash;
        delete sanitizedBody.otp_code;
        delete sanitizedBody.token;
        
        if (Object.keys(sanitizedBody).length > 0) {
            console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
        }
    }

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${timestamp}] ${method} ${url} -> ${res.statusCode} (${duration}ms)`);
    });

    next();
};

module.exports = { requestLogger };
