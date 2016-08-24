## Client Spec

1. Call `getViewData(name, data)` for every view provided.
  - 1.1 Use the return value as the `data` field's value for the Jobs Object.
2. Call `prepareRequest(currentJobs, originalJobs)` as a reducer.
  - 2.1 The return value becomes the new Jobs Object.
3. Call `shouldSendRequest(jobs)` and pass in the Jobs object.
  - 3.1 If `false`.
    * 3.1.1 Create a Response Object.
    * 3.1.2 The `html` attribute is the fallback client-rendered output.
    * 3.1.3 The `error` attribute should be `null`.
4. Call `willSendRequest(jobs)`.
  - 4.1 Submit the HTTP Request as a POST.
5. If any error occurs up until this point create a Response Object.
  - 5.1 The `error` attribute should equal the Error that was thrown.
  - 5.2 The `html` attribute is the fallback client-rendered output.
  - 5.3 Call `onError(error, jobs)`.
6. When a response is received from the server:
  - 6.1 Iterate over the response, if the `error` field is not null then call `onError(error, job)` per job.
  - 6.2 Ensure that every job has an `html` field and that it is a string. If there is no HTML then use the fallback client-rendered output.
7. Call `onSuccess(response, jobs)`.
8. Call `afterResponse(currentResponse, originalResponse)` as a reducer.
9. If an error is encountered then call `onError(error, jobs)` and assert that the fallback HTML is provided.

## Client URL and Request Information

#### Constructing the URL

`HOST` is whatever you're running Hypernova on `localhost` usually works if you're testing locally.

`PORT` is whatever is specified when you setup Hypernova. You can see an example [here in the README](https://github.com/airbnb/hypernova#node) and there's also [this working example](https://github.com/airbnb/hypernova/blob/master/examples/simple/hypernova.js#L13).

The URL is `/batch` and that's just because that's what it was named. It's the [only route](https://github.com/airbnb/hypernova/blob/master/src/worker.js#L21) that is defined for express.

So the full URL would be something like `http://localhost:3030/batch`

#### Posting a batch of jobs

The `POST` to `/batch` should look something like:

```js
{
  "NameOfComponent": {
    "name": "NameOfComponent",
    "data": {
      "theseAreProps": true,
      "someOtherProps": ["one", "two", "three"]
    },
  }
}
```

If [`getComponent`](https://github.com/airbnb/hypernova#getcomponent) returns something for `"NameOfComponent"` then you should be good to go.

## Plugin Lifecycle API

```typescript
function getViewData(viewName: string, data: any): any {}
```

Allows you to alter the data that a "view" will receive.

```typescript
type Job = { name: string, data: any };
type Jobs = { [string]: Job };
function prepareRequest(currentJobs: Jobs, originalJobs: Jobs): Jobs {}
```

A reducer type function that is called when preparing the request that will be sent to Hypernova. This function receives the current running jobs Object and the original jobs Object.

```typescript
function shouldSendRequest(jobs: Jobs): boolean {}
```

An `every` type function. If one returns `false` then the request is canceled.

```typescript
function willSendRequest(jobs: Jobs): void {}
```

An event type function that is called prior to a request being sent.

```typescript
type Job = { name: string, data: any };
type Response = {
  [string]: {
    error: ?Error,
    html: string,
    job: Job,
  },
};
function afterResponse(currentResponse: any, originalResponse: Response): any {}
```

A reducer type function which receives the current response and the original response from the Hypernova service.

```typescript
type Job = { name: string, data: any };
type Jobs = { [string]: Job };
function onSuccess(response: any, jobs: Jobs): void {}
```

An event type function that is called whenever a request was successful.

```typescript
type Job = { name: string, data: any };
type Jobs = { [string]: Job };
function onError(err: Error, jobs: Jobs): void {}
```

An event type function that is called whenever any error is encountered.
