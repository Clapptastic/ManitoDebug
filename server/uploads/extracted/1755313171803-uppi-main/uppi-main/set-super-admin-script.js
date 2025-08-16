// Script to set akclapp@gmail.com as super admin
const response = await fetch('https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/set-super-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    targetEmail: 'perryrjohnson7@gmail.com'
  })
});

const result = await response.json();
console.log(result);