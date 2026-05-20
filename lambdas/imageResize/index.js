const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

const sharp = require('sharp');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' ')
      );

      console.log(`Processing image: ${key}`);

      const original = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key
        })
      );

      const chunks = [];

      for await (const chunk of original.Body) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      const resized = await sharp(buffer)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_RESIZED,
          Key: key,
          Body: resized,
          ContentType: 'image/jpeg'
        })
      );

      console.log(`Successfully resized: ${key}`);
    }

    return {
      statusCode: 200,
      body: 'Images resized successfully'
    };

  } catch (error) {
    console.error('Lambda Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};