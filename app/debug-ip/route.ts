// TEMPORARY. Delete this whole folder after the test.
import { serverRequest } from "@/lib/api-server";
import { getVisitorIp } from "@/lib/visitor-ip";

export async function GET() {
  const visitorIp = await getVisitorIp();

  const response = await serverRequest("POST", "/auth/login", {
    body: {
      email: "nobody@example.test",
      password: "wrong-password",
      device_name: "debug",
    },
    visitorIp,
  });

  return Response.json({
    visitorIp,
    status: response.ok ? 200 : response.status,
  });
}
