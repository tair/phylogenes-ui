npm run build -- --mode dev

rm -rf _s3-upload
mkdir _s3-upload
mkdir _s3-upload/dist
cp -R dist/ _s3-upload/dist/
setx AWS_PROFILE phx-phylogenes-prod
aws --region=us-west-2 s3 rm s3://test.phylogenes.org$1 --recursive
aws --region=us-west-2 s3 cp _s3-upload/dist s3://test.phylogenes.org$1 --recursive