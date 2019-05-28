#!/bin/bash

./node_modules/.bin/ng build --prod --aot

for f in `ls dist`; do
    if [ "${f: -3}" == ".js" ]; then
        echo "Compressing $f"
        gzip -c dist/$f > dist/$f.gz
    fi
done

sed -i -e "s#href=\"styles#href=\"s/dist/styles#" dist/index.html
sed -i -e "s#src=\"main#src=\"s/dist/main#" dist/index.html
sed -i -e "s#src=\"runtime#src=\"s/dist/runtime#" dist/index.html
sed -i -e "s#src=\"polyfills#src=\"s/dist/polyfills#" dist/index.html
sed -i -e "s#src=\"es2015-polyfills#src=\"s/dist/es2015-polyfills#" dist/index.html
ln -sf dist/index.html index.html
