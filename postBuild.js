const fs = require('fs');
const shell = require('child_process').execSync;

console.log('Moving files to ./build');

try{
    const src = 'frontend/build';
    const dist = 'build/public';

    shell(`mkdir -p ${dist}`);
    shell(`cp -r ${src}/* ${dist}`);
}
catch(err){
    console.log('error copying client files');
}

try{
    const server_src = 'backend/build/index.js';
    const server_src_dest = 'build/index.js';
    shell(`cp ${server_src} ${server_src_dest}`);
}
catch(err){
    console.log('Error copying server files');
}
