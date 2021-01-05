npm run build -- --mode prod

rm -rf _s3-upload
mkdir _s3-upload
mkdir _s3-upload/dist
cp -R dist/ _s3-upload/dist/

aws --region=us-west-2 s3 rm s3://www.phylogenes.org$1 --recursive
aws --region=us-west-2 s3 cp _s3-upload/dist s3://www.phylogenes.org$1 --recursive