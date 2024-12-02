export class Strings {

    static CreateRandomString = () : string => {
        // const randString = Math.random() * len ?? 1000;
        // return randString.toString();
        return (Math.random() + 1).toString(36).substring(7);
    }

    static MakeId(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
}
export default Strings;