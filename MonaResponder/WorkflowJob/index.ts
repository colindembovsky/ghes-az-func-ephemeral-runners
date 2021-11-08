import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Octokit } from "@octokit/core";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    
    const action = req.body?.action;
    const org = req.body?.organization?.login;
    const repo = req.body?.repository?.name;
    const sender = req.body?.sender?.login;
    const run_id = req.body?.workflow_job?.run_id;

    const responseMessage = action
        ? `Hello, ${sender}. Acknowledge receipt of ${action} event in repo ${repo}.`
        : "This HTTP triggered function executed successfully. Expected 'workflow_job' payload.";

    const dispatch = await triggerAction(org, repo, action, run_id)

    context.res = {
        status: dispatch.status,
        body: dispatch.data
    };

};

async function triggerAction(org: string, repo: string, action: string, label: string) {
    const octokit = new Octokit({ 
        auth: process.env["PAT"],
        baseUrl: process.env["GITHUB_SERVER"] ? `${process.env["GITHUB_SERVER"]}/api/v3` : null
    });

    return await octokit.request('POST /repos/{org}/{repo}/actions/workflows/{workflow_name}/dispatches', {
        org: org,
        repo: repo,
        workflow_name: process.env["EPHEMERAL_RUNNER_WORKFLOW_NAME"],
        inputs: {
            label: label,
            action: action
        }
    });
}

export default httpTrigger;