import { ArgumentsHost, ExceptionFilter, HttpException } from "@nestjs/common";
import { HttpStatusCode } from "axios";
import { SUPPORTED_PATHS } from "./constants";

export class HttpExceptionFilter implements ExceptionFilter {
    public catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();
      const status = exception.getStatus();
      const isNotSupportedPath = !request.url.startsWith(`/${SUPPORTED_PATHS.PRODUCT}`) && !request.url.startsWith(`/${SUPPORTED_PATHS.CART}`);
  
      if (status === 404 && isNotSupportedPath) {
        response
          .status(HttpStatusCode.BadGateway)
          .send("Cannot process request");
      } else {
        response.status(status).json(exception.getResponse())
      }
    }
  }