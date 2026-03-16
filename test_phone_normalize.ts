const phone1 = '+91 9272109799';
const phone2 = '+919272109799';

const normalized1 = phone1.replace(/[\s\-\(\)\+]/g, '');
const normalized2 = phone2.replace(/[\s\-\(\)\+]/g, '');

console.log('Phone 1:', phone1);
console.log('Normalized 1:', normalized1);
console.log('Phone 2:', phone2);
console.log('Normalized 2:', normalized2);
console.log('Match:', normalized1 === normalized2);
