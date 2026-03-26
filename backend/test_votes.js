const http = require("http");

function sendRequest({ path, method, data, token }, callback) {
  const postData = data ? JSON.stringify(data) : null;
  const headers = {
    "Content-Type": "application/json"
  };

  if (postData) {
    headers["Content-Length"] = Buffer.byteLength(postData);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    hostname: "localhost",
    port: 5000,
    path,
    method,
    headers
  };

  const req = http.request(options, (res) => {
    res.setEncoding("utf8");
    let responseBody = "";

    res.on("data", (chunk) => {
      responseBody += chunk;
    });

    res.on("end", () => {
      let parsedBody = null;

      try {
        parsedBody = responseBody ? JSON.parse(responseBody) : {};
      } catch (error) {
        callback(new Error(`Invalid JSON response: ${responseBody}`), null);
        return;
      }

      if (res.statusCode >= 400) {
        callback(new Error(parsedBody.error || `Request failed with status ${res.statusCode}`), parsedBody);
        return;
      }

      callback(null, parsedBody);
    });
  });

  req.on("error", (error) => {
    callback(error, null);
  });

  if (postData) {
    req.write(postData);
  }

  req.end();
}

console.log("--- STARTING AUTH + VOTE TESTS ---");

sendRequest(
  {
    path: "/auth/signup",
    method: "POST",
    data: {
      userId: "u1",
      name: "Alice",
      email: "alice@example.com",
      password: "secret123"
    }
  },
  (signupError, signupResponse) => {
    if (signupError) {
      console.error("Signup error:", signupError.message);
      return;
    }

    console.log("Signup response:", signupResponse.message);

    sendRequest(
      {
        path: "/auth/login",
        method: "POST",
        data: {
          email: "alice@example.com",
          password: "secret123"
        }
      },
      (loginError, loginResponse) => {
        if (loginError) {
          console.error("Login error:", loginError.message);
          return;
        }

        console.log("Login response:", loginResponse.message);

        sendRequest(
          {
            path: "/vote",
            method: "POST",
            token: loginResponse.token,
            data: {
              date: "2026-03-27",
              status: "yes"
            }
          },
          (voteError1, voteResponse1) => {
            if (voteError1) {
              console.error("Vote 1 error:", voteError1.message);
              return;
            }

            console.log("Vote 1 response:", voteResponse1.message);

            sendRequest(
              {
                path: "/vote",
                method: "POST",
                token: loginResponse.token,
                data: {
                  date: "2026-03-27",
                  status: "no"
                }
              },
              (voteError2, voteResponse2) => {
                if (voteError2) {
                  console.error("Vote 2 error:", voteError2.message);
                  return;
                }

                console.log("Vote 2 response:", voteResponse2.message);

                sendRequest(
                  {
                    path: "/count/2026-03-27",
                    method: "GET"
                  },
                  (countError, countResponse) => {
                    if (countError) {
                      console.error("Count error:", countError.message);
                      return;
                    }

                    console.log("Count response:", countResponse);
                    console.log("--- TESTS COMPLETE ---");
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);
