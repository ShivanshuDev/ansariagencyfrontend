const axios = require('axios');

exports.handleImageUpload = async (event, location) => {
    const files = Array.from(event.target.files); // Convert FileList to an array

    try {
        // Generate presigned URLs and upload files in parallel
        const uploadPromises = files.map(async (file) => {
            const body = {
                fileName: location + file.name, // Prefix the location
                fileType: file.type,
            };

            // Step 1: Get presigned URL from the backend
            const response = await axios.post(
                `${process.env.VUE_APP_AGENCY_BACKEND_URL}uploadImages`,
                { body }
            );

            if (response.status === 200) {
                const url = response.data.url; // Extract presigned URL
                console.log('Presigned URL:', url);

                // Step 2: Upload file using the presigned URL
                const uploadResponse = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type },
                    body: file, // Pass the single file
                });

                if (uploadResponse.ok) {
                    return { fileName: file.name, status: 'success' };
                } else {
                    console.error(File `${file.name} upload failed.`);
                    return { fileName: file.name, status: 'failed' };
                }
            } else {
                console.error('Failed to get presigned URL', response.statusText);
                return { fileName: file.name, status: 'failed' };
            }
        });

        // Wait for all uploads to finish
        const results = await Promise.all(uploadPromises);

        return results; // Return results for further handling
    } catch (error) {
        console.error('Error during image upload:', error);
        throw error;
    }
};
