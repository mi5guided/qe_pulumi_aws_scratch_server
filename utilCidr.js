//  Requires node.js 7.0 or later (support for Exponentiation operator)

function generateSubnetCidrs(subnetWidth, cidrStr) {
  let prefixWidth = subnetWidth-cidrStr.split("/")[1];
  let blockRange = 2 ** prefixWidth;
  let slashArray = [];
  let hostWidth = 32-subnetWidth;

  let superSubnet = cidrStr.split("/")[0].split(".");
  let superNet = superSubnet[0]<<24;
  superNet += superSubnet[1]<<16;
  superNet += superSubnet[2]<<8;

  for (let i=0; i<blockRange; i++) {
    // shift by the smallest host width
    let subnet = (i<<hostWidth);
    slashArray = slashArray.concat(superNet+subnet);
  }

  return (slashArray.map((num) => { 
    return( ((num >> 24) & 0x000000FF)+"."+
      ((num >> 16) & 0x000000FF)+"."+
      ((num >> 8) & 0x000000FF)+"."+
      (num & 0x000000FF)+"/"+
      subnetWidth ); 
  }));
}

module.exports.getSubnetCidrs = generateSubnetCidrs;


