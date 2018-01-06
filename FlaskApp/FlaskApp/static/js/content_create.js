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

function follow_user(user_id) {
    $.getJSON('/people/follow_user', {
        'user_id': user_id
    }, function (followed_status) {
        var follow_button = document.getElementById("follow_button");
        if (followed_status.followed == 0) {
            follow_button.innerHTML = "<button onclick=\"javascript:follow_user({0})\" class=\"button button-fill button-success\">+关注</button>".format(user_id);
        } else {
            follow_button.innerHTML = "<button onclick=\"javascript:follow_user({0})\" class=\"button button-fill button\">正在关注</button>".format(user_id);
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
        if (quote.images) {
            var image_url = quote.images[0];
            quoted_image = "<div class=\"item-media media-left img-responsive\"><img src=\"{0}\" style='width: 5.2rem'></div>".format(image_url)
        }


        var quoted_html = "<br><div class=\"list-block media-list inset\">\n" +
            "        <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"item-link quote-card item-content\">\n" +
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

function render_follow(message) {
    var sponsor_nickname = message.sponsor_nickname;
    var sponsor_id = message.sponsor_id;
    var associate_nickname = message.associate_nickname;
    var associate_id = message.associate_id;
    var time = moment(message.time).fromNow();

    var html = "<div class=\"content-block-title\"><a href=\"/mobile/people/view_profile_{3}\"><span class=\"badge\">{0}</span></a>" +
        "&nbsp;{1}关注了<a href=\"/mobile/people/view_profile_{4}\"><span class=\"badge\">{2}</span></a></div>";
    return html.format(sponsor_nickname, time, associate_nickname, sponsor_id, associate_id)
}

function render_retweet(message) {
    var sponsor_nickname = message.sponsor_nickname;
    var sponsor_id = message.sponsor_id;
    var time = moment(message.time).fromNow();

    var html = "<div class=\"content-block-title\">" +
        "<i class=\"fa fa-retweet\" aria-hidden=\"true\"></i>&nbsp;" +
        "<a href=\"/mobile/people/view_profile_{3}\"><span class=\"badge\">{0}</span></a>&nbsp;{1}转发了</div>{2}";
    message_html = render_message(message);
    return html.format(sponsor_nickname, time, message_html, sponsor_id)
}

function render_comment_quote(message) {
    var id = message.author_id;
    var message_id = message.id;
    var nick_name = message.nickname;
    var user_name = message.username;
    var create_time = moment(message.time_create).fromNow();
    var content = message.body;
    var comment_count = message.comment_count;
    var quote_count = message.quote_count;
    var favo_count = message.favo_count;
    var is_favoed = message.is_favoed;
    var avatar_icon = message.avatar;

    var images = render_image(message.images);

    if (is_favoed) {
        favo_icon = "fa-heart"
    } else {
        favo_icon = "fa-heart-o"
    }

    quoted = render_quote(message.quoted) + "<br>";

    var raw = "<div class=\"row line\">\n" +
        "<div class=\"col-10 content-padded\" style='text-align:center'>\n" +
        "<a href=\"/mobile/people/view_profile_{0}\"><img class=\"avatar\" src=\"http://{11}\"></a>" +
        "</div>" +
        "<div class=\"col-80\">\n" +
        "    <div class=\"card-content\">" +
        "       <div class=\"card-content-inner no-border\">" +
        "      <a href=\"/mobile/people/view_profile_{0}\"><span class=\"nickname\">{1}</span></a> <span class='time'> {2}</span>\n" +
        "      <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"link item-content\"><div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div></a>{6}" +
        "    <div class=\"footer row\">\n" +
        "      <a id=\"favolink_{3}\" onclick=\"javascript:favo_message({3})\" href=\"#\" class=\"link col-25\"><i class=\"fa {10}\" aria-hidden=\"true\"> {7}</i></a>\n" +
        "      <a href=\"/mobile/message/reply_message_{3}\" class=\"link col-25\"><i class=\"fa fa-comments-o\" aria-hidden=\"true\"> {8}</i></a>\n" +
        "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-retweet\" aria-hidden=\"true\"> {9}</i></a>\n" +
        "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-envelope-o\" aria-hidden=\"true\"></i></a>\n" +
        "    </div>\n" +
        "</div></div>\n" +
        "  </div></div>";
    raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, favo_count, comment_count, quote_count, favo_icon, avatar_icon);
    return raw
}

function render_comment(message) {
    var id = message.author_id;
    var message_id = message.id;
    var nick_name = message.nickname;
    var user_name = message.username;
    var create_time = moment(message.time_create).fromNow();
    var content = message.body;
    var comment_count = message.comment_count;
    var quote_count = message.quote_count;
    var favo_count = message.favo_count;
    var is_favoed = message.is_favoed;
    var avatar_icon = message.avatar;

    var images = render_image(message.images);

    if (is_favoed) {
        favo_icon = "fa-heart"
    } else {
        favo_icon = "fa-heart-o"
    }

    quoted = render_comment_quote(message.quoted);
    quoted_author = message.quoted.username;

    var raw = "<div class=\"card facebook-card\">{6}\n" +
        "    <div class=\"card-header no-border\">\n" +
        "      <div class='time'>回复给 @{12}</div>" +
        "      <div class=\"facebook-avatar\"><a href=\"/mobile/people/view_profile_{0}\"><img class=\"avatar\" src=\"http://{11}\"></a></div>\n" +
        "      <div class=\"facebook-name\"><a href=\"/mobile/people/view_profile_{0}\"><span class=\"nickname\">{1}</span></a> <span class='time'> {2}</span></div>\n" +
        "    </div>\n" +
        "    <div class=\"card-content\">" +
        "       <div class=\"card-content-inner\">" +
        "      <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"link item-content\"><div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div><br></a>" +
        "    <div class=\"footer row\">\n" +
        "      <a id=\"favolink_{3}\" onclick=\"javascript:favo_message({3})\" href=\"#\" class=\"link col-25\"><i class=\"fa {10}\" aria-hidden=\"true\"> {7}</i></a>\n" +
        "      <a href=\"/mobile/message/reply_message_{3}\" class=\"link col-25\"><i class=\"fa fa-comments-o\" aria-hidden=\"true\"> {8}</i></a>\n" +
        "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-retweet\" aria-hidden=\"true\"> {9}</i></a>\n" +
        "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-envelope-o\" aria-hidden=\"true\"></i></a>\n" +
        "    </div>\n" +
        "</div></div>\n" +
        "  </div>";
    raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, favo_count, comment_count, quote_count, favo_icon, avatar_icon, quoted_author);
    return raw
}

function render_favo(message) {
    var sponsor_nickname = message.sponsor_nickname;
    var sponsor_id = message.sponsor_id;
    time = moment(message.time).fromNow();

    var html = "<div class=\"content-block-title\">" +
        "<i class=\"fa fa-heart\" aria-hidden=\"true\"></i>&nbsp;" +
        "<a href=\"/mobile/people/view_profile_{3}\"><span class=\"badge\">{0}</span></a>&nbsp;{1}喜欢了</div>{2}";
    message_html = render_message(message);
    return html.format(sponsor_nickname, time, message_html, sponsor_id)
}

function render_message(message) {
    var id = message.author_id;
    var message_id = message.id;
    var nick_name = message.nickname;
    var user_name = message.username;
    var create_time = moment(message.time_create).fromNow();
    var content = message.body;
    var comment_count = message.comment_count;
    var quote_count = message.quote_count;
    var favo_count = message.favo_count;
    var is_favoed = message.is_favoed;
    var avatar_icon = message.avatar;

    var images = render_image(message.images);

    if (is_favoed) {
        favo_icon = "fa-heart"
    } else {
        favo_icon = "fa-heart-o"
    }

    quoted = render_quote(message.quoted) + "<br>";

    var raw = "<div class=\"card facebook-card\">\n" +
        "    <div class=\"card-header no-border\">\n" +
        "      <div class=\"facebook-avatar\"><a href=\"/mobile/people/view_profile_{0}\"><img class=\"avatar\" src=\"http://{11}\"></a></div>\n" +
        "      <div class=\"facebook-name\"><a href=\"/mobile/people/view_profile_{0}\"><span class=\"nickname\">{1}</span></a> <span class='time'> {2}</span></div>\n" +
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
    return raw
}

function get_user_profile(user_id) {
    $.getJSON('/people/get_user_info/', {
        'user_id': user_id
    }, function (user_info) {
        var info_content = document.getElementById("user_info");
        info_content.innerHTML = " ";
        var nickname = user_info.nickname;
        var username = user_info.username;
        var country = user_info.country;
        var province = user_info.province;
        var city = user_info.city;
        var avatar = user_info.avatar;
        var followers = user_info.followers;
        var followed_users = user_info.followed_users;

        if (user_info.followed == 1) {
            follow_button = "<button onclick=\"javascript:follow_user({0})\" class=\"button button-fill button\">正在关注</button>".format(user_id);
        } else {
            follow_button = "<button onclick=\"javascript:follow_user({0})\" class=\"button button-fill button-success\">+关注</button>".format(user_id);
        }

        if (user_info.weixin_id) {
            weixin_id = user_info.weixin_id;
        } else {
            weixin_id = "未公开";
        }

        if (user_info.intro) {
            intro = user_info.intro;
        } else {
            intro = "<span class=\"time\">他还什么都没留下</span>";
        }

        var raw = "<div><img class=\"avatar-profile\"\n" +
            "          src=\"{8}\"/></div>\n" +
            "<div class=\"row\">\n" +
            "    <div class=\"col-20\" style=\"text-align: center\">\n" +
            "        <div class=\"nickname\">{0}</div>\n" +
            "        <div class=\"time\">@{1}</div>\n" +
            "    </div>\n" +
            "    <div class=\"col-50\">&nbsp;</div>\n" +
            "    <div class=\"col-30\" id=\"follow_button\">{2}\n" +
            "    </div>\n" +
            "</div>\n" +
            "<br>\n" +
            "<div class=\"row\">\n" +
            "    <div class=\"col-10\"></div>\n" +
            "    <div class=\"col-80\">{3}</div>\n" +
            "</div>\n" +
            "<br>\n" +
            "<div class=\"row\">\n" +
            "    <div class=\"col-10\"></div>\n" +
            "    <div class=\"col-40\">\n" +
            "        <i class=\"fa fa-map-marker\" aria-hidden=\"true\">\n" +
            "            {4} {5} {6}</i>\n" +
            "    </div>\n" +
            "    <div class=\"col-40\">\n" +
            "        <i class=\"fa fa-weixin\" aria-hidden=\"true\"> {7}</i>\n" +
            "    </div>\n" +
            "</div><br>" +
            "<div class=\"row\">\n" +
            "    <div class=\"col-10\"></div>\n" +
            "    <div class=\"col-40\"><span class='nickname'>{9}</span> 关注者</div>\n" +
            "    <div class=\"col-40\"><span class='nickname'>{10}</span> 正在关注 </div>\n" +
            "</div>\n";


        user_info_html = raw.format(nickname, username, follow_button, intro, country, province, city, weixin_id, avatar, followers, followed_users);

        $("#user_info").append(user_info_html);
    });
}

function get_followed_message(start, direction) {
    var card_list = "";
    $.ajax({
        url: '/timeline/get_followed_message/',
        async: false,
        data: {start: start, direction: direction},
        dataType: 'json',
        success: function (messages) {
            if (messages.num > 0) {
                if (window.last) {
                    if (window.last < messages.message_list[0].event_id) {
                        window.last = messages.message_list[0].event_id;
                    }
                } else {
                    window.last = messages.message_list[0].event_id;
                }

                if (window.first) {
                    if (window.first > messages.message_list[messages.num - 1].event_id) {
                        window.first = messages.message_list[messages.num - 1].event_id;
                    }
                } else {
                    window.first = messages.message_list[messages.num - 1].event_id;
                }

                for (var i = 0; i < messages.message_list.length; i++) {

                    if (messages.message_list[i].type == 1 || messages.message_list[i].type == 2) {
                        var message = render_message(messages.message_list[i]);
                    } else if (messages.message_list[i].type == 7) {
                        var message = render_follow(messages.message_list[i]);
                    } else if (messages.message_list[i].type == 4) {
                        var message = render_retweet(messages.message_list[i]);
                    } else if (messages.message_list[i].type == 5) {
                        var message = render_favo(messages.message_list[i]);
                    }
                    card_list = card_list + message;
                }
            }
        }
    });
    return card_list
}

function get_user_photos(start, user_id) {
    var images = "";
    $.ajax({
        url: '/people/get_user_photos/',
        async: false,
        data: {start: start, user_id: user_id},
        dataType: 'json',
        success: function (photos) {
            if (photos.num > 0) {
                for (var i = 0; i < photos.num; i++) {
                    caption = "<a href='/mobile/message/id_{0}' style='color: white; font-size: 0.6rem; text-align: left'>{1}</a>".format(photos.photo_list[i].relate_message,photos.photo_list[i].caption);
                    image_html = "<div class=\"independ_img\"><img src=\"http://{0}\" caption=\"{1}\"></div>";
                    images = images + image_html.format(photos.photo_list[i].url, caption);
                }
                images = "<div class=\"row no-gutter\" id='gallery'>" + images + "</div><br>"
            }
        }
    });
    return images
}

function get_user_message(start, message_type, user_id) {
    $.getJSON('/people/get_user_message/', {
        'start': start,
        'message_type': message_type,
        'user_id': user_id
    }, function (messages) {
        var message_list = document.getElementById("user_message_list");
        message_list.innerHTML = " ";
        if (messages.num > 0) {
            for (var i = 0; i < messages.message_list.length; i++) {

                if (messages.message_list[i].type == 1 || messages.message_list[i].type == 2) {
                    var message = render_message(messages.message_list[i]);
                } else if (messages.message_list[i].type == 7) {
                    var message = render_follow(messages.message_list[i]);
                } else if (messages.message_list[i].type == 4) {
                    var message = render_retweet(messages.message_list[i]);
                } else if (messages.message_list[i].type == 5) {
                    var message = render_favo(messages.message_list[i]);
                } else if (messages.message_list[i].type == 3) {
                    var message = render_comment(messages.message_list[i]);
                }
                $("#user_message_list").append(message);
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
        var type = messages.type;
        var html;
        var raw;


        var images = render_image(messages.images);
        if (is_favoed) {
            favo_icon = "fa-heart"
        } else {
            favo_icon = "fa-heart-o"
        }

        if (type == 1) {
            quoted = render_comment_quote(messages.quoted);
            quoted_author = messages.quoted.username;

            raw = "<div class=\"facebook-card\">{6}\n" +
                "    <div class=\"card-header no-border\">\n" +
                "      <div class='time'>回复给 @{12}</div>" +
                "      <div class=\"facebook-avatar\"><a href=\"/mobile/people/view_profile_{0}\"><img class=\"avatar\" src=\"http://{11}\"></a></div>\n" +
                "      <div class=\"facebook-name\"><a href=\"/mobile/people/view_profile_{0}\"><span class=\"nickname\">{1}</span></a> <span class='time'> {2}</span></div>\n" +
                "    </div>\n" +
                "    <div class=\"card-content\">" +
                "       <div class=\"card-content-inner\">" +
                "      <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"link item-content\"><div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div></a>" +
                "</div></div>\n" +
                "  </div>" +
                "<hr class=\"spliter\">\n" +
                "    <div class=\"footer row\">\n" +
                "      <a id=\"favolink_{3}\" onclick=\"javascript:favo_message({3})\" href=\"#\" class=\"link col-25\"><i class=\"fa {10}\" aria-hidden=\"true\"> {7}</i></a>\n" +
                "      <a href=\"/mobile/message/reply_message_{3}\" class=\"link col-25\"><i class=\"fa fa-comments-o\" aria-hidden=\"true\"> {8}</i></a>\n" +
                "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-retweet\" aria-hidden=\"true\"> {9}</i></a>\n" +
                "      <a href=\"#\" class=\"link col-25\"><i class=\"fa fa-envelope-o\" aria-hidden=\"true\"></i></a>\n" +
                "    </div>\n" +
                "<hr class=\"spliter\">";
            raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, favo_count, comment_count, quote_count, favo_icon, avatar_icon, quoted_author);

            html = $(raw);


        } else {
            quoted = render_quote(messages.quoted);

            raw = "<div class=\"facebook-card\">\n" +
                "    <div class=\"card-header no-border\">\n" +
                "      <div class=\"facebook-avatar\"><img class=\"avatar\" src=\"http://{11}\"></div>\n" +
                "      <a href=\"/mobile/people/view_profile_{0}\"><div class=\"facebook-name nickname\">{1} <br><span class='time'>{2}</span></div></a>\n" +
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
            html = $(raw);
        }


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

                var raw = "<div class=\"row\"><div class=\"col-12\"><a href=\"/mobile/people/view_profile_{0}\"><img class=\"avatar\" src=\"http://{10}\"></a></div>\n" +
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
        var type = messages.type;
        var html;
        var raw;

        var images = render_image(messages.images);

        if (type == 1) {
            quoted = render_comment_quote(messages.quoted);
            quoted_author = messages.quoted.username;

            raw = "<div class=\"facebook-card\">{6}\n" +
                "    <div class=\"card-header no-border\">\n" +
                "      <div class='time'>回复给 @{8}</div>" +
                "      <div class=\"facebook-avatar\"><a href=\"/mobile/people/view_profile_{0}\"><img class=\"avatar\" src=\"http://{7}\"></a></div>\n" +
                "      <div class=\"facebook-name\"><a href=\"/mobile/people/view_profile_{0}\"><span class=\"nickname\">{1}</span></a> <span class='time'> {2}</span></div>\n" +
                "    </div>\n" +
                "    <div class=\"card-content\">" +
                "       <div class=\"card-content-inner\">" +
                "      <a href=\"/mobile/message/id_{3}\" data-no-cache=\"true\" class=\"link item-content\"><div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div></a>" +
                "</div></div>\n" +
                "  </div>";
            raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, avatar_icon, quoted_author);

            html = $(raw);


        } else {

            quoted = render_quote(messages.quoted);

            raw = "<div class=\"facebook-card\">\n" +
                "    <div class=\"card-header no-border\">\n" +
                "      <div class=\"facebook-avatar\"><img class=\"avatar\" src=\"http://{7}\"></div>\n" +
                "      <div class=\"facebook-name nickname\">{1} <br><span class='time'>{2}</span></div>\n" +
                "    </div>\n" +
                "    <div class=\"card-content\">" +
                "       <div class=\"card-content-inner\">" +
                "      <div class=\"item-media\">{4}</div><div class=\"item-inner\">{5}</div>{6}" +
                "</div></div>\n" +
                "  </div>";
            raw = raw.format(id, nick_name, create_time, message_id, images, content, quoted, avatar_icon);
            html = $(raw);
        }

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