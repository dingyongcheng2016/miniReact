/***
 * @description 渲染流程
 * 
 */

//  const element = <h1 title="foo">Hello</h1>
//  const container = document.getElementById("root")
//  ReactDOM.render(element, container)

/***
 * @description 脱离react的实现
 */

// 现在让我们把所有 react 特有的代码部分（jsx）移除，全部替换为原版的js代码

// 替换 const element = <h1 title="foo">Hello</h1>
// const element = React.createElement(
//     "h1",
//     { title: "foo" },
//     "Hello"
//   )


// const element = {
//     type: "h1",
//     props: {
//       title: "foo",
//       children: "Hello",
//     },
// }


// 替换 ReactDOM.render(element, container)

// const node = document.createElement(element.type)
// node["title"] = element.props.title

// const text = document.createTextNode("")
// text["nodeValue"] = element.props.children

// node.appendChild(text)
// container.appendChild(node)



const element = {
    type: "h1",
    props: {
      title: "foo",
      children: "Hello",
    },
  }
  ​
  const container = document.getElementById("root")
  ​
  const node = document.createElement(element.type)
  node["title"] = element.props.title
  ​
  const text = document.createTextNode("")
  text["nodeValue"] = element.props.children
  ​
  node.appendChild(text)
  container.appendChild(node)