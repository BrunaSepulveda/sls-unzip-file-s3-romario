const AWS = require('aws-sdk');
const unzipper = require('unzipper');

const Bucket = {
  name: 'test-omega-rom',
  region: 'us-east-2',
};

const S3 = new AWS.S3({
  region: Bucket.region,
});

module.exports.handler = async (event) => {
  console.log('Iniciando aplicação');
  const fileKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );

  const params = {
    Bucket: Bucket.name,
    Key: fileKey,
  };

  try {
    const fileZipStream = S3.getObject(params).createReadStream();
    const files = fileZipStream.pipe(unzipper.Parse({ forceStream: true }));

    for await (const entry of files) {
      console.log(entry.path);
      const fileName = entry.path;
      const type = entry.type;
      const size = entry.vars.uncompressedSize;

      if (type.match(/file/gi)) {
        const params = {
          Bucket: Bucket.name,
          Key: `documentos/${fileName}`,
          Body: entry.on('finish', () => {
            console.log(`Stream 1 finish`);
          }),
          ContentLength: size,
        };

        await S3.upload(params).promise();
      } else {
        entry.autodrain();
      }
    }
  } catch (error) {
    console.log('Error downloading file from S3', error);
  }
};
