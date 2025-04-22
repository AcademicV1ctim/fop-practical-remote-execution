# FOP Practical Remote Execution

If unsure about the current flow of the code refer to below: 

1. Student will add the code and then run 'node run.js qn'.

2. run.js will send the written code to web server.

3. Web server will retrieve the expected output and the testcases from the db.

4. Submitted code will be sent to the Virtual Machine running docker with the expected output and the testcases.

5. Results will be sent back to the server and sends the result to the user's console.

# How to operate local server 

1. run npm i

2. To start the server run "npm run dev" 