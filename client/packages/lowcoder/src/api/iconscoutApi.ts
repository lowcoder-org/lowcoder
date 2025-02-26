import Api from "api/api";
import axios from "axios";

export type ResponseType = {
  response: any;
};

class IconScoutApi extends Api {
  static async downloadAsset(url: string): Promise<any> {
    const response = await axios.get(url, {responseType: 'blob'})
    return response?.data;
  }
}

export default IconScoutApi;