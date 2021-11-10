import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Octokit } from "@octokit/core";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    
    const action = req.body?.action;
    const org = req.body?.organization?.login;
    const repo = req.body?.repository?.name;
    const actor = req.body?.sender?.login;
    const run_id = req.body?.workflow_job?.run_id;
    
    const msg = action
    ? `Hello, ${actor}. Acknowledge receipt of ${action} event in repo ${repo}.`
    : "This HTTP triggered function executed successfully. Expected 'workflow_job' payload.";
    context.log(msg);

    // log info
    context.log(`Action: ${action}, org: ${org}, repo: ${repo}, sender: ${actor}, run_id: ${run_id}`);
    context.log(`GHES: ${process.env["GITHUB_SERVER"]}`);
    
    if (action !== "in_progress") {
        const dispatch = await triggerAction(context, org, repo, action, actor, run_id);
        context.res = {
            status: dispatch.status,
            body: dispatch.data
        };
    } else {
        context.res = {
            body: "Nothing to do for 'in_progress' event"
        };
    }
};

async function triggerAction(context: Context, org: string, repo: string, action: string, actor: string, run_id: string) {
    const baseUrl = process.env["GITHUB_SERVER"] ? `${process.env["GITHUB_SERVER"]}/api/v3` : null;
    context.log(`Attempting auth to GHES ${process.env["GITHUB_SERVER"]}`);
    const octokit = new Octokit({ 
        auth: process.env["PAT"],
        baseUrl: baseUrl
    });
    context.log("Auth successful");

    const spinner_org = process.env["EPHEMERAL_SPINNER_ORG"];
    const spinner_repo = process.env["EPHEMERAL_SPINNER_REPO"];
    const spinner_worfklow = process.env["EPHEMERAL_SPINNER_WORKFLOW"];
    const spinner_ref = process.env["EPHEMERAL_SPINNER_WORKFLOW_REF"];
    
    context.log(`Attempting dispatch to /repos/${spinner_org}/${spinner_repo}/actions/workflows/${spinner_worfklow}/dispatches`)
    return await octokit.request('POST /repos/{org}/{repo}/actions/workflows/{workflow_name}/dispatches', {
        baseUrl: baseUrl,
        org: spinner_org,
        repo: spinner_repo,
        workflow_name: spinner_worfklow,
        ref: spinner_ref,
        inputs: {
            action: action,
            org: org,
            repo: repo,
            actor: actor,
            identifier: `${org}-${repo}-${run_id}`
        }
    });
}

export default httpTrigger;