// Debug utility for transaction updates
export const debugTransactionUpdate = async (transactionId, updateData) => {
    try {
        console.log('Debug - Transaction Update Request:');
        console.log('Transaction ID:', transactionId);
        console.log('Update Data:', updateData);
        
        // Log the full request details
        const requestDetails = {
            url: `/api/transactions/${transactionId}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            data: updateData
        };
        
        console.log('Full Request Details:', requestDetails);
        
        // Make the actual request
        const response = await fetch(requestDetails.url, {
            method: requestDetails.method,
            headers: requestDetails.headers,
            body: JSON.stringify(requestDetails.data)
        });
        
        // Log response details
        console.log('Response Status:', response.status);
        const responseData = await response.json();
        console.log('Response Data:', responseData);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return responseData;
    } catch (error) {
        console.error('Debug - Transaction Update Error:', error);
        throw error;
    }
}; 