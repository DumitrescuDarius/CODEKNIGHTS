const beautify = require('js-beautify').js;
const code = `
#include <iostream>
using namespace std;
int main(){
for(int i=0;i<10;i++){
cout<<i<<endl;}
return 0;
}
`;
console.log(beautify(code, { indent_size: 4 }));
