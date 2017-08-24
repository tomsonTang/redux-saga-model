import featch from "isomorphic-fetch";

const fakingURL = "http://jsonplaceholder.typicode.com";
const getAllUsers = `${fakingURL}/users`;

function toJSON(featchP) {
  return featchP.then(checkStatus).then(parseJSON).catch(error => {
    console.log("request failed", error);
  });
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else if (response.headers.get("content-type") === "application/json") {
    const error = new Error("content-type error,is not a json");
    error.response = response;
    throw error;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

export const getUsers = () => toJSON(featch(getAllUsers));
