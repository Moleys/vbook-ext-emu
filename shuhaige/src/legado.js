/**
 * Extracts the selector and index from a selector part
 * @param {string} selectorPart - The selector part to process
 * @returns {Array} - [selector, index]
 */
function getSelectorIndex(selectorPart) {
  console.log("getSelectorIndex: " + selectorPart);
  var selector = '';
  var index;
  
  // Handle text selector format (text.sometext should find elements containing that text)
  if (selectorPart.indexOf('text.') === 0) {
    var searchText = selectorPart.substring(5); // Extract the text after 'text.'
    console.log("Text selector: searching for elements containing '" + searchText + "'");
    // Return special format to indicate this is a text-based selector
    return [{ type: 'text', value: searchText }, -1];
  }
  
  // Handle ID selector format (id.content should become #content)
  if (selectorPart.indexOf('id.') === 0) {
    selector = '#' + selectorPart.substring(3);
    console.log("ID selector converted: " + selector);
    return [selector, -1];
  }
  
  // Handle exclusion index with ! (e.g., .content p!-1)
  if (selectorPart.indexOf('!') > 0) {
    var parts = selectorPart.split('!');
    selector = parts[0];
    // Handle colon-separated exclusion indexes
    if (parts[1].indexOf(':') > 0) {
      var exclusionIndexes = parts[1].split(':').map(function(item) { 
        return Number(item); 
      });
      console.log("Exclusion indexes: " + exclusionIndexes);
      // For JSoup, we'll need to handle exclusion differently - return the selector and exclusion info
      return [selector, { type: 'exclusion', indexes: exclusionIndexes }];
    } else {
      var exclusionIndex = Number(parts[1]);
      console.log("Exclusion index: " + exclusionIndex);
      // For JSoup, we'll need to handle exclusion differently - return the selector and exclusion info
      return [selector, { type: 'exclusion', indexes: [exclusionIndex] }];
    }
  }
  
  if (selectorPart.indexOf('.') >= 0) {
    selector = selectorPart;
    if (selectorPart.indexOf('.') >= 0) {
      var indexStr = selectorPart.split('.').pop();
      if (indexStr && !isNaN(Number(indexStr))) {
        index = Number(indexStr);
        console.log("Index: " + index);
      } else if (indexStr && indexStr.indexOf(':') >= 0) {
        index = indexStr.split(':').map(function(item) { return Number(item); });
        console.log("Index array: " + index);
      }
      selector = selector.replace(/(\.?)([a-zA-Z]+)\.\d+(?::\d+)?$/, '$1$2');
    }
  } else {
    selector = selectorPart;
  }
  
  if (index === undefined) {
    index = -1;
  }
  
  console.log("Final selector: " + selector);
  return [selector, index];
}

/**
 * Checks if a selector is a paragraph selector
 * @param {string} selector - The selector to check
 * @returns {boolean} - Whether the selector is for paragraphs
 */
function isParagraphSelector(selector) {
  // Check if the selector ends with 'p' or contains 'p ' or 'p.'
  return selector === 'p' || 
         selector.endsWith(' p') || 
         selector.endsWith('>p') || 
         selector.match(/p[\.\s\[#]/) !== null;
}

/**
 * Parses a rule to extract content
 * @param {object} doc - The JSoup document
 * @param {string} rule - The rule to parse
 * @param {object} book - Optional book element
 * @returns {string} - The parsed content
 */
function parseRule(doc, rule, book) {
  console.log("parseRule: " + rule);
  
  // Special case for text-based link selection (common pattern)
  if (rule.startsWith("text.") && rule.endsWith("@href")) {
    var linkText = rule.substring(5, rule.length - 5);
    console.log("Special handling for link with text: " + linkText);
    
    try {
      // Try to find links directly
      var allLinks = (book || doc).select("a");
      console.log("Found " + allLinks.size() + " links to search");
      
      // First try exact matches
      for (var i = 0; i < allLinks.size(); i++) {
        var link = allLinks.get(i);
        var linkTextContent = "";
        
        try {
          linkTextContent = link.text();
          // console.log("Link " + i + " text: '" + linkTextContent + "'");
        } catch (e) {
          console.log("Error getting link text: " + e);
          continue;
        }
        
        if (linkTextContent && linkTextContent.trim() === linkText.trim()) {
          console.log("Found exact match link: " + linkTextContent);
          var href = "";
          
          try {
            href = link.attr("href");
            console.log("Link href: " + href);
          } catch (e) {
            console.log("Error getting href: " + e);
            continue;
          }
          
          if (href) {
            return href;
          }
        }
      }
      
      // If no exact matches, try contains
      console.log("No exact matches, trying contains matching");
      for (var i = 0; i < allLinks.size(); i++) {
        var link = allLinks.get(i);
        var linkTextContent = "";
        
        try {
          linkTextContent = link.text();
        } catch (e) {
          continue;
        }
        
        if (linkTextContent && linkTextContent.indexOf(linkText.trim()) >= 0) {
          console.log("Found link containing text: " + linkTextContent);
          var href = "";
          
          try {
            href = link.attr("href");
            console.log("Link href: " + href);
          } catch (e) {
            console.log("Error getting href: " + e);
            continue;
          }
          
          if (href) {
            return href;
          }
        }
      }
      
      // If still no matches, look for other elements that might be wrapped around links
      console.log("Checking for elements containing the text which might contain links");
      var allElements = (book || doc).select("*");
      for (var i = 0; i < allElements.size(); i++) {
        try {
          var elem = allElements.get(i);
          var elemText = elem.text();
          
          if (elemText && elemText.indexOf(linkText) >= 0) {
            console.log("Found element containing target text: " + elemText);
            
            // Check if it has an href directly
            var href = elem.attr("href");
            if (href) {
              console.log("Element has href: " + href);
              return href;
            }
            
            // Check if it contains a link
            var links = elem.select("a");
            if (links && links.size() > 0) {
              href = links.get(0).attr("href");
              console.log("Element contains link with href: " + href);
              return href;
            }
            
            // Check if parent or nearby siblings have links
            var parent = elem.parent();
            if (parent) {
              links = parent.select("a");
              if (links && links.size() > 0) {
                href = links.get(0).attr("href");
                console.log("Parent contains link with href: " + href);
                return href;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log("Special link handler error: " + e);
      console.log(e.stack || "No stack trace");
    }
  }
  
  var rules = rule.split('&&');
  if (rules.length > 1) {
    console.log("Multiple rules with &&");
    return rules.map(function(r) { return parseRule(doc, r, book); }).join('');
  }

  var parts = rule.split('@');
  var selectorPart = parts[0];
  var attrPart = parts[parts.length - 1];
  console.log("Selector: " + selectorPart + ", Attr: " + attrPart);
  var selectorAndIndex = getSelectorIndex(selectorPart);
  var selector = selectorAndIndex[0];
  var index = selectorAndIndex[1];
  
  // Check if we're dealing with paragraphs
  var isParagraph = selector && typeof selector === 'string' ? isParagraphSelector(selector) : false;
  console.log("Is paragraph selector: " + isParagraph);

  var result;
  try {
    // Handle text-based selectors
    if (selector && typeof selector === 'object' && selector.type === 'text') {
      console.log("Processing text-based selector for: " + selector.value);
      // Find elements containing the specified text
      var allElements = book ? book : doc;
      
      // Debug information about the document
      console.log("Document object type: " + (typeof allElements));
      console.log("Document has select method: " + (typeof allElements.select === 'function'));
      
      try {
        console.log("Attempting direct text-based selection if supported");
        try {
          // Try JSoup's :containsOwn selector if available
          result = allElements.select(":containsOwn(" + selector.value + ")");
          if (result && result.size() > 0) {
            console.log("Direct text selection worked! Found " + result.size() + " elements");
          } else {
            throw new Error("No results from direct text selection");
          }
        } catch (directSelectError) {
          console.log("Direct text selection failed: " + directSelectError);
          console.log("Falling back to manual text search");
          
          // In JSoup, we would use a special text selector like "*:containsOwn(text)"
          // For simplicity in this implementation, we'll select all elements and filter them
          console.log("Selecting all elements");
          var allTags;
          try {
            allTags = allElements.select("*");
            console.log("All elements selected: " + (allTags ? allTags.size() : 0));
          } catch (selectError) {
            console.log("Error selecting all elements: " + selectError);
            // Try to select common elements that might contain our text
            console.log("Trying to select common elements instead");
            allTags = allElements.select("a, p, div, span, h1, h2, h3, h4, h5, button");
            console.log("Common elements selected: " + (allTags ? allTags.size() : 0));
          }
          
          if (!allTags || allTags.size() === 0) {
            console.log("No elements to search through");
            return "";
          }
          
          console.log("Starting to filter elements by text content");
          var matchingElements = [];
          
          for (var i = 0; i < allTags.size(); i++) {
            try {
              var element = allTags.get(i);
              var elementText = "";
              
              try {
                elementText = element.text();
              } catch (textError) {
                console.log("Error getting text from element: " + textError);
                continue;
              }
              
              if (elementText && elementText.indexOf(selector.value) >= 0) {
                console.log("Found element with text: " + elementText);
                console.log("Element tag: " + (element.tagName ? element.tagName() : "unknown"));
                if (attrPart && element.hasAttr && element.hasAttr(attrPart)) {
                  console.log("Element has attribute " + attrPart + ": " + element.attr(attrPart));
                }
                matchingElements.push(element);
              }
            } catch (elementError) {
              console.log("Error processing element at index " + i + ": " + elementError);
              continue;
            }
          }
          
          console.log("Found " + matchingElements.length + " elements matching text: " + selector.value);
          
          // Return null if no elements matching the text are found
          if (matchingElements.length === 0) {
            console.log("No elements found matching text, returning null");
            return null;
          }
          
          // Create a collection from matching elements
          result = { 
            elements: matchingElements,
            size: function() { return this.elements.length; },
            get: function(idx) { return this.elements[idx]; },
            text: function() { 
              var allText = "";
              for (var i = 0; i < this.elements.length; i++) {
                allText += this.elements[i].text() + " ";
              }
              return allText.trim();
            },
            html: function() {
              var allHtml = "";
              for (var i = 0; i < this.elements.length; i++) {
                allHtml += this.elements[i].html() + " ";
              }
              return allHtml.trim();
            },
            outerHtml: function() {
              var allHtml = "";
              for (var i = 0; i < this.elements.length; i++) {
                allHtml += this.elements[i].outerHtml();
              }
              return allHtml;
            },
            attr: function(name) {
              return this.elements.length > 0 ? this.elements[0].attr(name) : "";
            },
            select: function(query) {
              var newElements = [];
              for (var i = 0; i < this.elements.length; i++) {
                var selected = this.elements[i].select(query);
                for (var j = 0; j < selected.size(); j++) {
                  newElements.push(selected.get(j));
                }
              }
              var newCollection = Object.create(this);
              newCollection.elements = newElements;
              return newCollection;
            }
          };
        }
      } catch (textSelectError) {
        console.log("Error during text selection process: " + textSelectError);
        console.log(textSelectError.stack || "No stack trace available");
        return "";
      }
    } else {
      // JSoup-style selection: book.select('selector')
      result = book ? book.select(selector) : doc.select(selector);
      console.log("Selection size: " + (result ? result.size() : 0));
    }
  } catch (e) {
    console.log("Selection error: " + e);
    console.log(e.stack || "No stack trace available");
    return "";
  }

  var indexArr = [];
  // Handle exclusion indexes
  if (index && typeof index === 'object' && index.type === 'exclusion') {
    try {
      console.log("Processing exclusion indexes: " + index.indexes);
      // For exclusion, we need to:
      // 1. Convert to array
      var elements = [];
      for (var i = 0; i < result.size(); i++) {
        elements.push(result.get(i));
      }
      
      // 2. Exclude the specified indexes
      var filteredElements = [];
      for (var i = 0; i < elements.length; i++) {
        var exclude = false;
        for (var j = 0; j < index.indexes.length; j++) {
          var excludeIndex = index.indexes[j];
          // Convert negative index to positive
          if (excludeIndex < 0) {
            excludeIndex = elements.length + excludeIndex;
          }
          if (i === excludeIndex) {
            exclude = true;
            break;
          }
        }
        if (!exclude) {
          filteredElements.push(elements[i]);
        }
      }
      
      // 3. If we only have 1 element, use it directly, otherwise make a collection
      if (filteredElements.length === 1) {
        result = filteredElements[0];
        console.log("Single element after exclusion");
      } else if (filteredElements.length > 0) {
        // We need to create a collection from the filtered elements
        // In JSoup-like implementation, you would create a new Elements object
        // For simplicity, we'll assume the collection has same methods
        console.log("Multiple elements after exclusion: " + filteredElements.length);
        // Pretend we've created a new collection - implementation will vary
        // This is a placeholder for the actual implementation
        result = { 
          elements: filteredElements,
          size: function() { return this.elements.length; },
          get: function(idx) { return this.elements[idx]; },
          text: function() { 
            var allText = "";
            for (var i = 0; i < this.elements.length; i++) {
              allText += this.elements[i].text() + " ";
            }
            return allText.trim();
          },
          html: function() {
            var allHtml = "";
            // For paragraphs, preserve the full HTML structure
            if (isParagraph) {
              for (var i = 0; i < this.elements.length; i++) {
                allHtml += this.elements[i].outerHtml();
              }
            } else {
              for (var i = 0; i < this.elements.length; i++) {
                allHtml += this.elements[i].html() + " ";
              }
            }
            return allHtml.trim();
          },
          outerHtml: function() {
            var allHtml = "";
            for (var i = 0; i < this.elements.length; i++) {
              allHtml += this.elements[i].outerHtml();
            }
            return allHtml;
          },
          attr: function(name) {
            return this.elements.length > 0 ? this.elements[0].attr(name) : "";
          },
          select: function(query) {
            var newElements = [];
            for (var i = 0; i < this.elements.length; i++) {
              var selected = this.elements[i].select(query);
              for (var j = 0; j < selected.size(); j++) {
                newElements.push(selected.get(j));
              }
            }
            var newCollection = Object.create(this);
            newCollection.elements = newElements;
            return newCollection;
          }
        };
      } else {
        console.log("No elements after exclusion");
        return "";
      }
    } catch (e) {
      console.log("Exclusion processing error: " + e);
      return "";
    }
  } else if (typeof index === 'number' && index >= 0) {
    try {
      console.log("Getting element at index: " + index);
      // JSoup-style: elements.get(index) instead of eq(index)
      result = result.get(index);
    } catch (e) {
      console.log("Index error: " + e);
      return "";
    }
  } else if (Object.prototype.toString.call(index) === '[object Array]') {
    indexArr = index;
  }

  if (parts.length > 2) {
    var otherPart = parts[1];
    console.log("Additional part: " + otherPart);
    var selectorAndIndex2 = getSelectorIndex(otherPart);
    var selector2 = selectorAndIndex2[0];
    var index2 = selectorAndIndex2[1];
    try {
      // JSoup-style: element.select(selector)
      result = result.select(selector2);
      console.log("Secondary selection size: " + (result ? result.size() : 0));
      
      // Update isParagraph check after secondary selection
      isParagraph = isParagraphSelector(selector2);
      console.log("Is paragraph selector (after secondary): " + isParagraph);
    } catch (e) {
      console.log("Secondary selection error: " + e);
      return "";
    }
    if (typeof index2 === 'number' && index2 >= 0) {
      try {
        // JSoup-style: elements.get(index)
        result = result.get(index2);
      } catch (e) {
        console.log("Secondary index error: " + e);
        return "";
      }
    } else if (Object.prototype.toString.call(index2) === '[object Array]') {
      indexArr = index2;
    }
  }
  var selectorArr = selector.split(',');

  if (selectorArr.length > 1) {
    console.log("Multiple comma-separated selectors: " + selectorArr.length);
    return selectorArr.map(function(s) { return parseRule(doc, s + '@' + attrPart, book); }).join(',');
  }

  var finalResult = "";
  if (attrPart === 'text' || attrPart === 'textNodes') {
    console.log("Extracting text");
    if (indexArr.length > 0) {
      var texts = [];
      for (var i = 0; i < indexArr.length; i++) {
        try {
          // JSoup-style: element.text()
          var text = result.get(indexArr[i]).text();
          console.log("Text at index " + i + ": " + text);
          texts.push(text);
        } catch (e) {
          console.log("Text extraction error at index: " + e);
          // continue
        }
      }
      finalResult = texts.join(',');
    } else {
      try {
        // JSoup-style: element.text()
        var text = result.text();
        finalResult = text.replace(/[\n\s]/g, '').trim();
        console.log("Text result: " + finalResult);
      } catch (e) {
        console.log("Text extraction error: " + e);
        finalResult = "";
      }
    }
  } else if (attrPart === 'html') {
    try {
      // JSoup-style: element.html()
      if (result.size && result.size() > 1 && isParagraph) {
        // For multiple paragraph elements, preserve the full structure
        finalResult = result.outerHtml ? result.outerHtml() : result.html();
      } else {
        finalResult = result.html() || '';
      }
      console.log("HTML result length: " + finalResult.length);
    } catch (e) {
      console.log("HTML extraction error: " + e);
      finalResult = "";
    }
  } else if (attrPart === 'outerHtml') {
    try {
      // JSoup-style: element.outerHtml()
      finalResult = result.outerHtml ? result.outerHtml() : result.html();
      console.log("Outer HTML result length: " + finalResult.length);
    } catch (e) {
      console.log("Outer HTML extraction error: " + e);
      finalResult = "";
    }
  } else {
    try {
      // JSoup-style: element.attr('attribute')
      console.log("Extracting attribute: " + attrPart);
      
      // For text-based selectors with elements collection
      if (result && result.elements && result.elements.length > 0) {
        console.log("Found " + result.elements.length + " elements for attribute extraction");
        for (var i = 0; i < result.elements.length; i++) {
          var element = result.elements[i];
          var attrValue = element.attr ? element.attr(attrPart) : element.getAttribute(attrPart);
          console.log("Element " + i + " " + attrPart + ": " + attrValue);
          
          // Use the first non-empty attribute found
          if (attrValue) {
            finalResult = attrValue.trim();
            break;
          }
        }
      } else {
        var attr = result.attr(attrPart || '');
        finalResult = attr ? attr.trim() : '';
      }
      
      console.log("Attribute result: " + finalResult);
    } catch (e) {
      console.log("Attribute extraction error: " + e);
      console.log(e.stack || e);
      finalResult = "";
    }
  }
  
  console.log("Final result: " + finalResult);
  return finalResult;
}

/**
 * Converts a pattern to a RegExp object
 * @param {string} pattern - The pattern to convert
 * @returns {RegExp} - The RegExp object
 */
function stringToRegex(pattern) {
  console.log("Creating regex from: " + pattern);
  var regexPattern = new RegExp(pattern.replace(/\\\\/g, '\\'), '');
  return regexPattern;
}

/**
 * Removes the domain from a URL
 * @param {string} url - The URL to process
 * @returns {string} - The URL without domain
 */
function removeDomain(url) {
  console.log("Remove domain from: " + url);
  if (!isValidUrl(url)) {
    return url;
  }
  var urlObj = new URL(url);
  return urlObj.pathname;
}

/**
 * Gets the domain from a URL
 * @param {string} url - The URL to process
 * @returns {string} - The domain
 */
function getDomain(url) {
  var urlObj = new URL(url);
  return urlObj.hostname;
}

/**
 * Checks if a URL is valid
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Analyzes rules to extract content
 * @param {object} doc - The JSoup document
 * @param {string} rules - The rules to analyze
 * @param {object} book - Optional book element
 * @returns {string|object} - The analyzed content
 */
function analysisRules(doc, rules, book) {
  console.log("analysisRules: " + rules);
  if (!rules) {
    console.log("Rules is empty");
    return undefined;
  }

  var ruleParts = rules.split('##');
  var rule = ruleParts[0];
  var reg = ruleParts.slice(1);
  console.log("Rule: " + rule + ", Regex parts: " + reg.length);

  if (!book) {
    var startArr = rule.split('||');
    if (startArr.length > 1) {
      console.log("Multiple rules with ||");
      var result;
      for (var i = 0; i < startArr.length; i++) {
        var resultInfo = analysisRules(doc, startArr[i]);
        if (resultInfo && resultInfo.size && resultInfo.size() > 0) {
          console.log("Found valid result at index: " + i);
          result = resultInfo;
          break;
        }
      }
      return result;
    }
    
    // IMPORTANT: Process direct attribute extraction for simple selectors
    if (rule.indexOf('@') > 0) {
      var parts = rule.split('@');
      
      // Don't process further if this is a compound rule
      if (parts.length > 2) {
        console.log("Compound rule detected, using standard processing");
      } else {
        var selector = parts[0];
        var attr = parts[1];
        
        // For direct attribute extraction, we should use parseRule instead
        // of trying to handle selectors like '.content p!-1' directly
        console.log("Using parseRule for direct attribute extraction: " + rule);
        return parseRule(doc, rule, null);
      }
    }
    
    // This section is only reached if the previous special handling didn't return
    var atParts = rule.split('@');
    var startParts = atParts[0];
    var endParts = atParts[1];
    console.log("Start parts: " + startParts + ", End parts: " + endParts);
    
    // Handle ID selector conversion here too
    if (startParts.indexOf('id.') === 0) {
      startParts = '#' + startParts.substring(3);
      console.log("Converted ID selector: " + startParts);
    }
    
    if (endParts) {
      try {
        // JSoup-style: doc.select(selector).select(selector)
        var result = doc.select(startParts).select(endParts);
        console.log("Two-part selection size: " + result.size());
        return result;
      } catch (e) {
        console.log("Two-part selection error: " + e);
        return undefined;
      }
    }
    
    try {
      // JSoup-style: doc.select(selector)
      var result = doc.select(startParts);
      console.log("One-part selection size: " + result.size());
      return result;
    } catch (e) {
      console.log("One-part selection error: " + e);
      return undefined;
    }
  }
  
  // When book parameter is provided
  var ruleArr = rule.split('||');

  if (ruleArr.length >= 2) {
    console.log("Multiple OR rules: " + ruleArr.length);
    return ruleArr.map(function(r) { return parseRule(doc, r, book); }).join('');
  }

  if (reg.length === 0 || reg[0] === '') {
    console.log("No regex, parsing simple rule");
    return parseRule(doc, rule, book);
  }
  
  // If matching rule exists, remove matched content
  if (reg.length === 1) {
    console.log("One regex part for replacement");
    var result = parseRule(doc, rule, book);
    console.log("Before regex: " + result);
    if (result) {
      result = result.replace(new RegExp(reg[0], 'g'), '');
      result = result.replace(reg[0].replace('.', ':'), '');
      result = result.replace(reg[0].replace('.', '：'), '');
      console.log("After regex: " + result);
      return result.trim();
    }
    return '';
  }
  
  // Parse complex rules like:
  // 'a@href##.+\\D((\\d+)\\d{3})\\D##http://img.bayizww.com/$2/$1/$1s.jpg###'
  if (reg.length >= 2) {
    console.log("URL transformation with regex");
    var regRule = reg[0];
    var regContent = reg[1];
    var href = parseRule(doc, rule, book);
    console.log("Original URL: " + href);
    var regex = stringToRegex(regRule);
    var pathOnly = removeDomain(href || '');
    console.log("Path only: " + pathOnly);
    var match = pathOnly.match(regex);
    console.log("Match count: " + (match ? match.length : 0));
    var newUrl = '';
    if (match && match.length) {
      newUrl = regContent.replace(/\$(\d+)/g, function(_, groupIndex) { 
        console.log("Replace $" + groupIndex + " with " + match[groupIndex]);
        return match[groupIndex]; 
      });
      console.log("New URL: " + newUrl);
    }
    return newUrl;
  }
  console.log("No matching rule condition");
  return undefined;
}

/**
 * Parses a JSON string
 * @param {string} str - The string to parse
 * @returns {object|string} - The parsed object or the original string if parsing fails
 */
function parseJson(str) {
  try {
    var result = JSON.parse(str);
    console.log("JSON parsed successfully");
    return result;
  } catch (e) {
    console.log("JSON parse error: " + e);
    return str;
  }
} 