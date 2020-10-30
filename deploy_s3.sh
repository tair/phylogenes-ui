#npm run build -- --mode dev

rm -rf _s3-upload
mkdir _s3-upload
mkdir _s3-upload/dist
mkdir _s3-upload/dist/src
cp -R dist/ _s3-upload/dist/
cp -R src/ _s3-upload/dist/src/

#aws --region=us-west-2 s3 rm s3://test.phylogenes.org$1 --recursive
#aws --region=us-west-2 s3 cp _s3-upload/ s3://test.phylogenes.org$1 --recursive