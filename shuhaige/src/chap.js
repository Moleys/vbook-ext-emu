load('legado-bs.js');
load('legado.js');
load('function.js');

function execute(url) {
    let ruleContent = bs.ruleContent
    let content = ""
    if(ruleContent.nextContentUrl) content = getMultipart(url)
    else content = getNormal(url)
    return Response.success(content);
}

function getNormal(url)
{
    let response = fetch(url)
    if (!response.ok) return null;
    let doc = response.html();
    let ruleContent = bs.ruleContent
    let content = analysisRules(doc, ruleContent.content)
    if(ruleContent.replaceRegex) {
        let sourceRegex = ruleContent.replaceRegex|| ""
        content = content.replace(new RegExp(ruleContent.replaceRegex, 'g'), sourceRegex)
    }
    return content
}


function getMultipart(url) {
    let ruleContent = bs.ruleContent
    let response = fetch(url);
    if (response.ok) {
        let doc;
        let nextPart = url;
        let content = '';
        do {
            console.log(nextPart)
            doc = fetch(nextPart).html();
            nextPart = analysisRules(doc, ruleContent.nextContentUrl)
                console.log(JSON.stringify("Next URL1: " + nextPart))

            // Check if nextPart is a string and not null/undefined
            if (nextPart && typeof nextPart === 'string') {
                if (!nextPart.startsWith("http")) {
                    nextPart = getBaseUrl(url) + nextPart;
                }
                console.log(JSON.stringify("Next URL: " + nextPart))
            } else {
                // If nextPart is not a string or is empty, set to null to end the loop
                console.log("No valid next URL found")
                nextPart = null;
            }

            content += analysisRules(doc, ruleContent.content)
        } while (nextPart)
        if(ruleContent.replaceRegex) {
            let sourceRegex = ruleContent.replaceRegex|| ""
            content = content.replace(new RegExp(ruleContent.replaceRegex, 'g'), sourceRegex)
        }
        return Response.success(content);
    }
    return null;
}
