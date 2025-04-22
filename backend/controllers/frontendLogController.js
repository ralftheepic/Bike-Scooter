const logFrontendError = (req, res) => {
      const logData = req.body;

      if (!logData || !logData.level || !logData.message) {
        console.warn('Received incomplete frontend log payload');
        return res.status(400).json({ message: 'Incomplete log data' });
      }
    
      console.error(`FRONTEND LOG [${logData.level.toUpperCase()}]: ${logData.message}`);
      if (logData.source) console.error(`   Source: ${logData.source}:${logData.lineno}:${logData.colno}`);
      if (logData.stack) console.error(`   Stack: ${logData.stack}`);
      if (logData.reason) console.error(`   Reason: ${logData.reason}`);
    
    
      // Send a success response back to the frontend (important!)
      res.status(200).json({ message: 'Log received' });
    };
    
    export default {
      logFrontendError,
    };