import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  let response = {
    isAuthorized: false,
    context: {},
  };

  const identity = (event['identitySource'][0] ?? '').split(';');
  let token = null;

  for (let ident of identity) {
    if (ident.trim().startsWith('accessToken')) {
      const identSplit = ident.trim().split('accessToken=');
      token = identSplit[1].trim();
      break;
    }
  }

  if (token === null) {
    return response;
  }

  const user = jwt.verify(
    token,
    Buffer.from(process.env.JWT_SECRET_KEY, 'base64').toString('utf-8'),
    {
      ignoreExpiration: true,
    },
    (err, usr) => {
      if (err) {
        console.log(`error: ${err}`);
        return null;
      }

      return usr;
    }
  );

  if (user === null) {
    throw new Error('Unauthorized');
  }

  response = {
    isAuthorized: true,
    context: {
      user,
    },
  };

  return response;
};
