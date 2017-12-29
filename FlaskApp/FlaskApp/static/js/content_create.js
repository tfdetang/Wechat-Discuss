String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (a, num) {
        return args[num] || a
    })
};

function favo_message(message_id) {
    $.getJSON('/message/favo_message/', {
        'message_id': message_id
    }, function (favo_count) {
        var favolink = document.getElementById("favolink_" + message_id);
        if (favo_count.favo == 1) {
            favolink.innerHTML = "<i class=\"fa fa-heart\" aria-hidden=\"true\"> {0}</i>".format(favo_count.count)
        } else {
            favolink.innerHTML = "<i class=\"fa fa-heart-o\" aria-hidden=\"true\"> {0}</i>".format(favo_count.count)
        }
    })
}

function setClickHandler(id, fn) {
    document.getElementById(id).onclick = fn;
}


function render_image(image_list) {
    var images = " ";
    if (image_list.length > 0) {
        var img_count = image_list.length;
        if (img_count == 1) {
            var width = " ";
            var responsive = "img-responsive-single"
        } else if (img_count == 2) {
            var width = "col-50";
            var responsive = "img-responsive"
        } else if (img_count == 3) {
            var width = "col-33";
            var responsive = "img-responsive"
        } else {
            var width = "col-50";
            var responsive = "img-responsive"
        }
        for (var j = 0; j < img_count; j++) {
            image_html = "<div class=\"{0} {1}\"><img src=\"" + image_list[j] + "\"></div>";
            images = images + image_html.format(width, responsive);
        }
        images = "<div class=\"row no-gutter\">" + images + "</div><br>"
    }
    return images;
}

function render_quote(quote) {
    var quoted = " ";
    if (quote) {
        var quoted_id = quote.id;
        var quoted_body = quote.body;
        var quoted_author_id = quote.author_id;
        var quoted_nickname = quote.nickname;
        quoted_image = " ";
        if (quote.image) {
            var image_url = quote.image;
            quoted_image = "<div class=\"item-media media-left img-responsive\"><img src=\"{0}\" style='width: 5rem'></div>".format(image_url)
        }


        var quoted_html = "<br><div class=\"list-block media-list\">\n" +
            "        <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"item-link item-content\">\n" +
            "          {0}<div class=\"item-inner\">\n" +
            "            <div class=\"item-title-row\">\n" +
            "              <div class=\"item-title\" style=\"font-size:0.6rem;color: darkgray;\">@{1}</div>\n" +
            "            </div>\n" +
            "            <div class=\"item-text\" style=\"font-size:0.6rem\">{2}</div>\n" +
            "          </div>\n" +
            "        </a>\n" +
            "  </div>";

        var quoted = quoted_html.format(quoted_image, quoted_nickname, quoted_body, quoted_id)
    }
    return quoted
}

function get_followed_message(start) {
    $.getJSON('/timeline/get_followed_message/', {
        'start': '0'
    }, function (messages) {
        if (messages.num > 0) {
            for (var i = 0; i < messages.message_list.length; i++) {

                var id = messages.message_list[i].author_id;
                var message_id = messages.message_list[i].id;
                var nick_name = messages.message_list[i].nickname;
                var create_time = moment(messages.message_list[i].time_create).fromNow();
                var content = messages.message_list[i].body;
                var comment_count = messages.message_list[i].comment_count;
                var quote_count = messages.message_list[i].quote_count;
                var favo_count = messages.message_list[i].favo_count;
                var is_favoed = messages.message_list[i].is_favoed;
                var avatar_icon = messages.message_list[i].avatar;

                var images = render_image(messages.message_list[i].images);

                if (is_favoed) {
                    favo_icon = "fa-heart"
                } else {
                    favo_icon = "fa-heart-o"
                }

                quoted = render_quote(messages.message_list[i].quoted) + "<br>";

                var raw = "<div class=\"card facebook-card\">\n" +
                    "    <div class=\"card-header no-border\">\n" +
                    "      <div class=\"facebook-avatar\"><img src=\"http://{11}\" width=\"34\" height=\"34\"></div>\n" +
                    "      <div class=\"facebook-name\">{1} <span class='time'>{2}</span></div>\n" +
                    "    </div>\n" +
                    "    <div class=\"card-content\">" +
                    "       <div class=\"card-content-inner\">" +
                    "      <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"link item-content\"><div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div></a>{6}" +
                    "    <div class=\"footer row\">\n" +
                    "      <a id=\"favolink_{3}\" onclick=\"javascript:favo_message({3})\" href=\"#\" class=\"link col-25\"><i class=\"fa {10}\" aria-hidden=\"true\"> {7}</i></a>\n" +
                    "      <a href=\"/mobile/message/reply_message_{3}\" class=\"link col-25\"><i class=\"fa fa-comments-o\" aria-hidden=\"true\"> {8}</i></a>\n" +
                    "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-retweet\" aria-hidden=\"true\"> {9}</i></a>\n" +
                    "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-envelope-o\" aria-hidden=\"true\"></i></a>\n" +
                    "    </div>\n" +
                    "</div></div>\n" +
                    "  </div>";
                raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, favo_count, comment_count, quote_count, favo_icon, avatar_icon);
                var html = $(raw);

                $("#card_list").append(html);
            }

        }

    });

}

function get_message_detail(id) {
    $.getJSON('/timeline/message_{0}'.format(id), {}, function (messages) {
        var message_content = document.getElementById("message_detail");
        message_content.innerHTML = " ";
        var id = messages.author_id;
        var message_id = messages.id;
        var nick_name = messages.nickname;
        var create_time = moment(messages.time_create).fromNow();
        var content = messages.body;
        var comment_count = messages.comment_count;
        var quote_count = messages.quote_count;
        var favo_count = messages.favo_count;
        var is_favoed = messages.is_favoed;
        var avatar_icon = messages.avatar;


        var images = render_image(messages.images);

        quoted = render_quote(messages.quoted);

        if (is_favoed) {
            favo_icon = "fa-heart"
        } else {
            favo_icon = "fa-heart-o"
        }

        var raw = "<div class=\"facebook-card\">\n" +
            "    <div class=\"card-header no-border\">\n" +
            "      <div class=\"facebook-avatar\"><img src=\"http://{11}\" width=\"35\" height=\"35\"></div>\n" +
            "      <div class=\"facebook-name nickname\">{1} <br><span class='time'>{2}</span></div>\n" +
            "    </div>\n" +
            "    <div class=\"card-content\">" +
            "       <div class=\"card-content-inner\">" +
            "      <div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div>{6}" +
            "</div></div>\n" +
            "  </div>" +
            "<hr class=\"spliter\">\n" +
            "<div class=\"row\">\n" +
            "    <a id=\"favolink_{3}\" onclick=\"javascript:favo_message({3})\" href=\"#\" class=\"link col-25\"><i class=\"fa {10}\" aria-hidden=\"true\"> {7}</i></a>\n" +
            "    <a href=\"/mobile/message/reply_message_{3}\" class=\"link col-25\"><i class=\"fa fa-comments-o\" aria-hidden=\"true\"> {8}</i></a>\n" +
            "    <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-retweet\" aria-hidden=\"true\"> {9}</i></a>\n" +
            "    <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-envelope-o\" aria-hidden=\"true\"></i></a>\n" +
            "</div>\n" +
            "<hr class=\"spliter\">";
        raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, favo_count, comment_count, quote_count, favo_icon, avatar_icon);
        var html = $(raw);

        $("#message_detail").append(html);

    });
}

function get_message_replies(id) {
    $.getJSON('/timeline/message_{0}/get_replies'.format(id), {
        'start': '0'
    }, function (replies) {
        var replies_content = document.getElementById("message_replies");
        replies_content.innerHTML = " ";
        if (replies.count > 0) {
            for (var i = 0; i < replies.replies.length; i++) {
                var id = replies.replies[i].author_id;
                var message_id = replies.replies[i].id;
                var nick_name = replies.replies[i].nickname;
                var create_time = moment(replies.replies[i].time_create).fromNow();
                var content = replies.replies[i].body;
                var comment_count = replies.replies[i].comment_count;
                var quote_count = replies.replies[i].quote_count;
                var favo_count = replies.replies[i].favo_count;
                var is_favoed = replies.replies[i].is_favoed;
                var reply_type = replies.replies[i].type;
                var avatar_icon = replies.replies[i].avatar;

                if (is_favoed) {
                    favo_icon = "fa-heart"
                } else {
                    favo_icon = "fa-heart-o"
                }

                if (reply_type == 1) {
                    reply_icon = "<span class=\"fa-stack\">\n" +
                        "  <i class=\"fa fa-square-o fa-stack-2x\"></i>\n" +
                        "  <i class=\"fa fa-comments fa-stack-1x\"></i>\n" +
                        "</span>"
                } else {
                    reply_icon = "<span class=\"fa-stack\">\n" +
                        "  <i class=\"fa fa-square-o fa-stack-2x\"></i>\n" +
                        "  <i class=\"fa fa-retweet fa-stack-1x\"></i>\n" +
                        "</span>"
                }

                var raw = "<div class=\"row\"><div class=\"col-12\"><img src=\"http://{10}\" width=\"40\" height=\"40\"></div>\n" +
                    "<div class=\"col-85\">\n" +
                    "     <div class=\"nickname\">{1} <span class=\"time\">{2} {9}</span></div>\n" +
                    "          <div>{3}</div><br>\n" +
                    "          <div class=\"row\" style=\"text-align: left;\">\n" +
                    "               <a id=\"favolink_{7}\" onclick=\"javascript:favo_message({7})\" href=\"#\" class=\"link col-25\"><i class=\"fa {8}\" aria-hidden=\"true\"> {4}</i></a>\n" +
                    "               <a href=\"/mobile/message/reply_message_{7}\" class=\"link col-25\"><i class=\"fa fa-comments-o\" aria-hidden=\"true\"> {5}</i></a>\n" +
                    "               <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-retweet\" aria-hidden=\"true\"> {6}</i></a>\n" +
                    "               <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-envelope-o\" aria-hidden=\"true\"></i></a>\n" +
                    "           </div>\n" +
                    "       <hr class=\"spliter\">\n" +
                    " </div></div>";
                raw = raw.format(id, nick_name, create_time, content, favo_count, comment_count, quote_count, message_id, favo_icon, reply_icon, avatar_icon);
                var html = $(raw);

                $("#message_replies").append(html);
            }
        }
    });
}

function get_message_detail_no_bar(id) {
    $.getJSON('/timeline/message_{0}'.format(id), {}, function (messages) {
        var message_content = document.getElementById("message_detail");
        message_content.innerHTML = " ";
        var id = messages.author_id;
        var message_id = messages.id;
        var nick_name = messages.nickname;
        var create_time = moment(messages.time_create).fromNow();
        var content = messages.body;
        var avatar_icon = messages.avatar;

        var images = render_image(messages.images);

        quoted = render_quote(messages.quoted);

        var raw = "<div class=\"facebook-card\">\n" +
            "    <div class=\"card-header no-border\">\n" +
            "      <div class=\"facebook-avatar\"><img src=\"http://{7}\" width=\"35\" height=\"35\"></div>\n" +
            "      <div class=\"facebook-name nickname\">{1} <br><span class='time'>{2}</span></div>\n" +
            "    </div>\n" +
            "    <div class=\"card-content\">" +
            "       <div class=\"card-content-inner\">" +
            "      <div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div>{6}" +
            "</div></div>\n" +
            "  </div>";
        raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, avatar_icon);
        var html = $(raw);

        $("#message_detail").append(html);

    });
}

function reply_message(id) {
    var text = $('#textareaContents').val();
    if (text) {
        $.getJSON('/message/reply_message_{0}'.format(id), {
            'comment': text
        }, function (messages) {
            if (messages.status == 'success') {
                $.toast("发布成功");
            }
        });
        setTimeout(function () {
            window.history.back();
        }, 2000);

    } else {
        $.toast("请填写回复")
    }

}