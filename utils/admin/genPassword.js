// export default function generateRandomPassword(length = 12) {
//   const lowercase = "abcdefghijklmnopqrstuvwxyz";
//   const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   const digits = "0123456789";
//   const special = "@$!%*?&";
//   const allChars = lowercase + uppercase + digits + special;

//   let password = "";

//   // Ensure at least one character from each required category
//   password += lowercase[Math.floor(Math.random() * lowercase.length)];
//   password += uppercase[Math.floor(Math.random() * uppercase.length)];
//   password += digits[Math.floor(Math.random() * digits.length)];
//   password += special[Math.floor(Math.random() * special.length)];

//   // Fill the rest of the password length with random characters
//   for (let i = 4; i < length; i++) {
//     password += allChars[Math.floor(Math.random() * allChars.length)];
//   }

//   // Shuffle the password to avoid predictable pattern
//   password = password
//     .split('')
//     .sort(() => Math.random() - 0.5)
//     .join('');

//   return password;
// }

// genPassword.js

function generateRandomPassword(length = 12) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "@$!%*?&";
  const allChars = lowercase + uppercase + digits + special;

  let password = "";

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  password = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');

  return password;
}

module.exports = generateRandomPassword;