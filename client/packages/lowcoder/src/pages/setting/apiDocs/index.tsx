import '@stoplight/elements/styles.min.css';

import { API } from '@stoplight/elements';
import React from 'react';

const ApiDocs: React.FC = () => {
  return (
    <API
      basePath="lowcoder-api"
      apiDescriptionUrl="https://api-service.lowcoder.cloud/api/docs/api-docs"
    />
  );
};

export default ApiDocs;
