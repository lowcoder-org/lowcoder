# Setting up an Environment

Follow these Steps to create/setup an Environment on Lowcoder :&#x20;

1. **Central PostgreSQL DB :** For the Enterprise Edition, there is this main requirement of having a Central PostgreSQL Database which will be same for all the Environments, you will configure. Each Environment will have a separate MongoDB, but there will be a shared PostgreSQL DB for all the Envs.
2. **Add Environment :** Click on the "Add Environment" button and fill up the details in the Form \
   ![](<../../../../.gitbook/assets/frame_generic_light (26).png>)
3. **Form Details :** Add Environment Name, Choose Environment type like Test or Production, Enter API Service URL and the API Key. This API key is of the Lowcoder Instance that you need to setup. More details about the Lowcoder API Key is here : [lowcoder-open-rest-api.md](../../../../lowcoder-extension/lowcoder-open-rest-api.md "mention") . If it is a Master Env, then turn the Toggle ON in the Pop up . Click on "Create Environment" button.\
   ![](<../../../../.gitbook/assets/frame_generic_light (1) (5).png>)
4. **Clone the Lowcoder Repositary :** Now, to setup the Lowcoder instance, you need to clone from Lowcoder Repositary. The details can be found here : [self-hosting](../../../self-hosting/ "mention")
5. **Add EE docker-compose.yaml file :**&#x20;
6. **Add changes in docker-compose.yaml file :**&#x20;
   1. Name the Environment and Container name\
      ![](<../../../../.gitbook/assets/frame_generic_light (27).png>)
   2. Setup Sub-domain : \
      You should setup a sub-domains for different Environments, and access your Envs from those sub-domains.
7.  **Changes to envUtils.ts file :** \
    This file is located in **lowcoder/client/packages/lowcoder/src/util/envUtils.ts.** Add highlighted code in the mentioned place OR simply run this command :&#x20;

    ```bash
    LOWCODER_API_SERVICE_URL=your_ip_address REACT_APP_EDITION="enterprise" yarn workspace lowcoder start
    ```

    \
    ![](<../../../../.gitbook/assets/frame_generic_light (1) (6).png>)\
